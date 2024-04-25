import {
  Address,
  Hex,
  PublicClient,
  createPublicClient,
  http,
  Hash,
  serializeTransaction,
  hashMessage,
  toBytes,
  isBytes,
  SignableMessage,
  verifyMessage,
  signatureToHex,
} from "viem";
import {
  BaseTx,
  NearEthAdapterParams,
  NearContractFunctionPayload,
  TxPayload,
  TransactionWithSignature,
} from "../types";
import { MultichainContract } from "../mpcContract";
import BN from "bn.js";
import { queryGasPrice } from "../utils/gasPrice";
import { buildTxPayload, addSignature } from "../utils/transaction";
// import { ethers } from "ethers";

export class NearEthAdapter {
  ethClient: PublicClient;
  private scanUrl: string;
  private gasStationUrl: string;

  mpcContract: MultichainContract;
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
    console.log("Signature received");
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
    transaction: Hex;
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
   * @param {number?} nonce - Optional transaction nonce.
   * @returns Transaction and its bytes (the payload to be signed on Near).
   */
  async createTxPayload(tx: BaseTx, nonce?: number): Promise<TxPayload> {
    const transaction = await this.buildTransaction(tx, nonce);
    console.log("Built (unsigned) Transaction", transaction);
    const signArgs = {
      payload: buildTxPayload(transaction),
      path: this.derivationPath,
      key_version: 0,
    };
    return { transaction, signArgs };
  }

  async buildTransaction(tx: BaseTx, nonce?: number): Promise<Hex> {
    const transactionData = {
      nonce:
        nonce ||
        (await this.ethClient.getTransactionCount({
          address: this.sender,
        })),
      account: this.sender,
      to: tx.to,
      value: tx.value ?? 0n,
      data: tx.data ?? "0x",
    };
    const [estimatedGas, { maxFeePerGas, maxPriorityFeePerGas }, chainId] =
      await Promise.all([
        this.ethClient.estimateGas(transactionData),
        queryGasPrice(this.gasStationUrl),
        this.ethClient.getChainId(),
      ]);
    const transactionDataWithGasLimit = {
      ...transactionData,
      gas: BigInt(estimatedGas.toString()),
      maxFeePerGas,
      maxPriorityFeePerGas,
      chainId,
    };
    console.log("Gas Estimation:", estimatedGas);
    console.log("Transaction Request", transactionDataWithGasLimit);
    return serializeTransaction(transactionDataWithGasLimit);
  }

  reconstructSignature(tx: TransactionWithSignature): Hex {
    return addSignature(tx, this.sender);
  }

  /**
   * Relays signed transaction to Ethereum mem-pool for execution.
   * @param serializedTransaction - Signed Ethereum transaction.
   * @returns Transaction Hash of relayed transaction.
   */
  private async relaySignedTransaction(
    serializedTransaction: Hex
  ): Promise<Hash> {
    const txHash = await this.ethClient.sendRawTransaction({
      serializedTransaction,
    });
    console.log(`Transaction Confirmed: ${this.scanUrl}/tx/${txHash}`);
    return txHash;
  }
  // Below code is inspired by https://github.com/Connor-ETHSeoul/near-viem

  async signMessage(message: SignableMessage): Promise<Hash> {
    const sigs = await this.sign(hashMessage(message));
    const address = this.ethPublicKey();
    const validity = await Promise.all([
      verifyMessage({
        address,
        message,
        signature: sigs[0],
      }),
      verifyMessage({
        address,
        message: message,
        signature: sigs[1],
      }),
    ]);
    return this.pickValidSignature(validity, sigs);
  }

  async sign(msgHash: `0x${string}` | Uint8Array): Promise<[Hex, Hex]> {
    const hashToSign = isBytes(msgHash) ? msgHash : toBytes(msgHash);

    const { big_r, big_s } = await this.mpcContract.requestSignature({
      path: this.derivationPath,
      payload: Array.from(hashToSign.reverse()),
      key_version: 0,
    });
    const r = `0x${big_r.substring(2)}` as Hex;
    const s = `0x${big_s}` as Hex;

    return [
      signatureToHex({ r, s, yParity: 0 }),
      signatureToHex({ r, s, yParity: 1 }),
    ];
  }

  private pickValidSignature(
    [valid0, valid1]: [boolean, boolean],
    [sig0, sig1]: [Hash, Hash]
  ): Hash {
    if (!valid0 && !valid1) {
      throw new Error("Invalid signature");
    } else if (valid0) {
      return sig0;
    } else {
      return sig1;
    }
  }
}
