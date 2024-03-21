import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import {
  Address,
  parseEther,
  Hex,
  PublicClient,
  createPublicClient,
  http,
} from "viem";
import { GasPriceResponse, GasPrices, TxPayload } from "../types";
import { getFirstNonZeroGasPrice } from "../utils/gasPrice";
import { MultichainContract } from "../mpc_contract";

export interface BaseTx {
  receiver: Address;
  amount: number;
  data?: Hex;
}

export class EVM {
  private client: PublicClient;
  private scanUrl: string;
  private gasStationUrl: string;
  private mpcContract: MultichainContract;
  private derivationPath: string;
  sender: Address;

  /**
   * Constructs an EVM instance with the provided configuration.
   *
   * @param {Object} config - The configuration object for the EVM instance.
   * @param {string} config.providerUrl - The URL of the Ethereum JSON RPC provider.
   * @param {string} config.scanUrl - The base URL of the blockchain explorer.
   * @param {string} config.gasStationUrl - The base URL of the blockchain gas station.
   * @param {string} config.mpcContract - A instance of the NearMPC contract connected to the associated near account.
   */
  constructor(config: {
    providerUrl: string;
    scanUrl: string;
    gasStationUrl: string;
    mpcContract: MultichainContract;
    derivationPath: string;
    sender: Address;
  }) {
    this.client = createPublicClient({ transport: http(config.providerUrl) });
    this.scanUrl = config.scanUrl;
    this.mpcContract = config.mpcContract;
    this.gasStationUrl = config.gasStationUrl;
    this.derivationPath = config.derivationPath;
    this.sender = config.sender;
  }

  static async fromConfig(config: {
    providerUrl: string;
    scanUrl: string;
    gasStationUrl: string;
    mpcContract: MultichainContract;
    derivationPath?: string;
  }): Promise<EVM> {
    const { derivationPath, ...rest } = config;
    // Sender is uniquely determined by the derivation path!
    const path = derivationPath || "ethereum,1";
    return new EVM({
      sender: await config.mpcContract.deriveEthAddress(path),
      derivationPath: path,
      ...rest,
    });
  }

  signAndSendTransaction = async (txData: BaseTx): Promise<void> => {
    console.log("Creating Payload for sender:", this.sender);
    const { transaction, payload } = await this.createTxPayload(txData);
    console.log("Requesting signature from Near...");
    const { big_r, big_s } = await this.mpcContract.requestSignature(
      payload,
      this.derivationPath
    );

    const signedTx = EVM.reconstructSignature(
      transaction,
      big_r,
      big_s,
      this.sender
    );
    console.log("Relaying signed tx to EVM...");
    await this.relayTransaction(signedTx);
  };

  async queryGasPrice(): Promise<GasPrices> {
    console.log("Querying gas station:", this.gasStationUrl);
    const res = await fetch(this.gasStationUrl);
    const gasPrices = (await res.json()) as GasPriceResponse;
    const maxPriorityFeePerGas = BigInt(getFirstNonZeroGasPrice(gasPrices)!);

    // Since we don't have a direct `baseFeePerGas`, we'll use a workaround.
    // Ideally, you should fetch the current `baseFeePerGas` from the network.
    // Here, we'll just set a buffer based on `maxPriorityFeePerGas` for demonstration purposes.
    // This is NOT a recommended practice for production environments.
    const buffer = BigInt(2 * 1e9); // Example buffer of 2 Gwei, assuming the API values are in WEI
    const maxFeePerGas = maxPriorityFeePerGas + buffer;
    return { maxFeePerGas, maxPriorityFeePerGas };
  }

  private async buildTransaction(
    tx: BaseTx
  ): Promise<FeeMarketEIP1559Transaction> {
    const nonce = await this.client.getTransactionCount({
      address: this.sender,
    });
    const { maxFeePerGas, maxPriorityFeePerGas } = await this.queryGasPrice();
    const transactionData = {
      nonce,
      account: this.sender,
      to: tx.receiver,
      value: parseEther(tx.amount.toString()),
      data: tx.data || "0x",
    };
    const estimatedGas = await this.client.estimateGas(transactionData);
    const transactionDataWithGasLimit = {
      ...transactionData,
      gasLimit: BigInt(estimatedGas.toString()),
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId: await this.client.getChainId(),
    };
    console.log("TxData:", transactionDataWithGasLimit);
    return FeeMarketEIP1559Transaction.fromTxData(transactionDataWithGasLimit);
  }

  async createTxPayload(tx: BaseTx): Promise<TxPayload> {
    const transaction = await this.buildTransaction(tx);
    console.log("Built Transaction", JSON.stringify(transaction));
    const payload = Array.from(
      new Uint8Array(transaction.getHashedMessageToSign().slice().reverse())
    );
    return { transaction, payload };
  }

  static reconstructSignature = (
    transaction: FeeMarketEIP1559Transaction,
    big_r: string,
    big_s: string,
    sender: Address
  ): FeeMarketEIP1559Transaction => {
    const r = Buffer.from(big_r.substring(2), "hex");
    const s = Buffer.from(big_s, "hex");

    const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
    const signature = candidates.find(
      (c) =>
        c.getSenderAddress().toString().toLowerCase() === sender.toLowerCase()
    );

    if (!signature) {
      throw new Error("Signature is not valid");
    }

    return signature;
  };

  relayTransaction = async (
    signedTransaction: FeeMarketEIP1559Transaction
  ): Promise<string> => {
    const serializedTx = bytesToHex(signedTransaction.serialize()) as Hex;
    const txHash = await this.client.sendRawTransaction({
      serializedTransaction: serializedTx,
    });
    console.log(`Transaction Confirmed: ${this.scanUrl}/tx/${txHash}`);
    return txHash;
  };
}
