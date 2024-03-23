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
  NearContractFunctionPayload,
  TxPayload,
  TransactionWithSignature,
} from "../types";
import { queryGasPrice } from "../utils/gasPrice";
import { MultichainContract } from "../mpcContract";
import BN from "bn.js";

export class NearEthAdapter {
  private ethClient: PublicClient;
  private scanUrl: string;
  private gasStationUrl: string;

  private mpcContract: MultichainContract;
  private derivationPath: string;
  private sender: Address;

  private constructor(config: {
    providerUrl: string;
    scanUrl: string;
    gasStationUrl: string;
    mpcContract: MultichainContract;
    derivationPath: string;
    sender: Address;
  }) {
    this.ethClient = createPublicClient({
      transport: http(config.providerUrl),
    });
    this.scanUrl = config.scanUrl;
    this.mpcContract = config.mpcContract;
    this.gasStationUrl = config.gasStationUrl;
    this.derivationPath = config.derivationPath;
    this.sender = config.sender;
  }

  /**
   * @returns ETH address derived by Near account via `derivationPath`.
   */
  ethPublicKey(): Address {
    return this.sender;
  }
  /**
   * @returns Near accountId linked to derived ETH.
   */
  nearAccountId(): string {
    return this.mpcContract.contract.account.accountId;
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
   * @param {BN} nearGas - manually specified gas to be sent with signature request (default 200 TGAS).
   * Note that the signature request is a recursive function.
   */
  async signAndSendTransaction(txData: BaseTx, nearGas?: BN): Promise<Hash> {
    console.log("Creating Payload for sender:", this.sender);
    const { transaction, signArgs } = await this.createTxPayload(txData);
    console.log("Requesting signature from Near...");
    const { big_r, big_s } = await this.mpcContract.requestSignature(
      signArgs,
      nearGas
    );

    return this.relayTransaction({ transaction, signature: { big_r, big_s } });
  }

  /**
   * Takes a minimally declared Ethereum Transaction,
   * builds the full transaction payload (with gas estimates, prices etc...),
   * acquires signature from Near MPC Contract and submits transaction to public mempool.
   *
   * @param {BaseTx} txData - Minimal transaction data to be signed by Near MPC and executed on EVM.
   * @param {BN} nearGas - manually specified gas to be sent with signature request (default 200 TGAS).
   * Note that the signature request is a recursive function.
   */
  async getSignatureRequestPayload(
    txData: BaseTx,
    nearGas?: BN
  ): Promise<{
    transaction: FeeMarketEIP1559Transaction;
    requestPayload: NearContractFunctionPayload;
  }> {
    console.log("Creating Payload for sender:", this.sender);
    const { transaction, signArgs } = await this.createTxPayload(txData);
    console.log("Requesting signature from Near...");
    return {
      transaction,
      requestPayload: await this.mpcContract.encodeSignatureRequestTx(
        signArgs,
        nearGas
      ),
    };
  }

  /**
   * Relays valid representation of signed transaction to Etherem mempool for execution.
   *
   * @param {TransactionWithSignature} tx - Signed Ethereum transaction.
   * @returns Hash of relayed transaction.
   */
  async relayTransaction(tx: TransactionWithSignature): Promise<Hash> {
    const signedTx = await this.reconstructSignature(tx);
    return this.relaySignedTransaction(signedTx);
  }

  /**
   * Builds a complete, unsigned transaction (with nonce, gas estimates, current prices)
   * and payload bytes in preparation to be relayed to Near MPC contract.
   *
   * @param {BaseTx} tx - Minimal transaction data to be signed by Near MPC and executed on EVM.
   * @returns Transaction and its bytes (the payload to be signed on Near).
   */
  async createTxPayload(tx: BaseTx): Promise<TxPayload> {
    const transaction = await this.buildTransaction(tx);
    console.log("Built (unsigned) Transaction", transaction.toJSON());
    const payload = Array.from(
      new Uint8Array(transaction.getHashedMessageToSign().slice().reverse())
    );
    const signArgs = { payload, path: this.derivationPath, key_version: 0 };
    return { transaction, signArgs };
  }

  private async buildTransaction(
    tx: BaseTx
  ): Promise<FeeMarketEIP1559Transaction> {
    const nonce = await this.ethClient.getTransactionCount({
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
    const estimatedGas = await this.ethClient.estimateGas(transactionData);
    const transactionDataWithGasLimit = {
      ...transactionData,
      gasLimit: BigInt(estimatedGas.toString()),
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId: await this.ethClient.getChainId(),
    };
    return FeeMarketEIP1559Transaction.fromTxData(transactionDataWithGasLimit);
  }

  private reconstructSignature = (
    tx: TransactionWithSignature
  ): FeeMarketEIP1559Transaction => {
    const { transaction, signature: sig } = tx;
    const r = Buffer.from(sig.big_r.substring(2), "hex");
    const s = Buffer.from(sig.big_s, "hex");

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
  private async relaySignedTransaction(
    signedTx: FeeMarketEIP1559Transaction
  ): Promise<Hash> {
    const serializedTx = bytesToHex(signedTx.serialize()) as Hex;
    const txHash = await this.ethClient.sendRawTransaction({
      serializedTransaction: serializedTx,
    });
    console.log(`Transaction Confirmed: ${this.scanUrl}/tx/${txHash}`);
    return txHash;
  }
}
