import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import {
  Address,
  parseEther,
  Hex,
  PublicClient,
  createPublicClient,
  http,
  Hash,
} from "viem";
import {
  BaseTx,
  NearEthAdapterParams,
  NearSignPayload,
  TxPayload,
} from "../types";
import { queryGasPrice } from "../utils/gasPrice";
import { MultichainContract } from "../mpcContract";
import BN from "bn.js";

export class NearEthAdapter {
  private client: PublicClient;
  private scanUrl: string;
  private gasStationUrl: string;
  private mpcContract: MultichainContract;
  private derivationPath: string;
  sender: Address;

  private constructor(config: {
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

  /**
   * Constructs an EVM instance with the provided configuration.
   * @param {NearEthAdapterParams} args - The configuration object for the Adapter instance.
   */
  static async fromConfig(args: NearEthAdapterParams): Promise<NearEthAdapter> {
    // Sender is uniquely determined by the derivation path!
    const mpcContract = args.near.mpcContract;
    const derivationPath = args.near.derivationPath || "ethereum,1";
    return new NearEthAdapter({
      sender: await mpcContract.deriveEthAddress(derivationPath),
      derivationPath,
      mpcContract,
      ...args.evm,
    });
  }

  /**
   * Takes a minimally declared Ethereum Transaction,
   * builds the full transaction payload (with gas estimates, prices etc...),
   * acquires signature from Near MPC Contract and submits transaction to public mempool.
   *
   * @param {BaseTx} txData - Minimal transaction data to be signed by Near MPC and executed on EVM.
   */
  async signAndSendTransaction(txData: BaseTx, nearGas?: BN): Promise<Hash> {
    console.log("Creating Payload for sender:", this.sender);
    const { transaction, payload } = await this.createTxPayload(txData);
    console.log("Requesting signature from Near...");
    const { big_r, big_s } = await this.mpcContract.requestSignature(
      payload,
      this.derivationPath,
      nearGas
    );

    const signedTx = this.reconstructSignature(transaction, big_r, big_s);
    console.log("Relaying signed tx to EVM...");
    return this.relayTransaction(signedTx);
  }

  async getSignatureRequstPayload(
    txData: BaseTx,
    nearGas?: BN
  ): Promise<NearSignPayload> {
    console.log("Creating Payload for sender:", this.sender);
    const { payload } = await this.createTxPayload(txData);
    console.log("Requesting signature from Near...");
    return this.mpcContract.buildSignatureRequestTx(
      payload,
      this.derivationPath,
      nearGas
    );
  }

  reconstructSignature = (
    transaction: FeeMarketEIP1559Transaction,
    big_r: string,
    big_s: string
  ): FeeMarketEIP1559Transaction => {
    const r = Buffer.from(big_r.substring(2), "hex");
    const s = Buffer.from(big_s, "hex");

    const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
    const signature = candidates.find(
      (c) =>
        c.getSenderAddress().toString().toLowerCase() ===
        this.sender.toLowerCase()
    );

    if (!signature) {
      throw new Error("Signature is not valid");
    }

    return signature;
  };

  /**
   * Relays signed transaction to Etherem mempool for execution.
   * @param signedTx - Signed Ethereum transaction.
   * @returns Transaction Hash of relayed transaction.
   */
  async relayTransaction(signedTx: FeeMarketEIP1559Transaction): Promise<Hash> {
    const serializedTx = bytesToHex(signedTx.serialize()) as Hex;
    const txHash = await this.client.sendRawTransaction({
      serializedTransaction: serializedTx,
    });
    console.log(`Transaction Confirmed: ${this.scanUrl}/tx/${txHash}`);
    return txHash;
  }

  /**
   * Builds a complete, unsigned transaction (with nonce, gas estimates, current prices)
   * and payload bytes in preparation to be relayed to Near MPC contract.
   *
   * @param {BaseTx} tx - Minimal transaction data to be signed by Near MPC and executed on EVM.
   * @returns transacion and its bytes (the payload to be signed on Near)
   */
  private async createTxPayload(tx: BaseTx): Promise<TxPayload> {
    const transaction = await this.buildTransaction(tx);
    console.log("Built Transaction", JSON.stringify(transaction));
    const payload = Array.from(
      new Uint8Array(transaction.getHashedMessageToSign().slice().reverse())
    );
    return { transaction, payload };
  }

  private async buildTransaction(
    tx: BaseTx
  ): Promise<FeeMarketEIP1559Transaction> {
    const nonce = await this.client.getTransactionCount({
      address: this.sender,
    });
    const { maxFeePerGas, maxPriorityFeePerGas } = await queryGasPrice(
      this.gasStationUrl
    );
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
}
