import {
  Address,
  Hex,
  Hash,
  serializeTransaction,
  hashMessage,
  SignableMessage,
  serializeSignature,
  hashTypedData,
  TypedData,
  TypedDataDefinition,
  parseTransaction,
  keccak256,
  Signature,
} from "viem";
import {
  BaseTx,
  AdapterParams,
  FunctionCallTransaction,
  TxPayload,
  TransactionWithSignature,
  NearEthTxData,
  SignArgs,
  RecoveryData,
} from "../types";
import { MpcContract } from "../mpcContract";
import {
  buildTxPayload,
  addSignature,
  populateTx,
  toPayload,
} from "../utils/transaction";
import { Network } from "../network";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { wcRouter } from "../wallet-connect/handlers";

export class NearEthAdapter {
  readonly mpcContract: MpcContract;
  readonly address: Address;
  readonly derivationPath: string;

  private constructor(config: {
    mpcContract: MpcContract;
    derivationPath: string;
    sender: Address;
  }) {
    this.mpcContract = config.mpcContract;
    this.derivationPath = config.derivationPath;
    this.address = config.sender;
  }

  /**
   * @returns Near accountId linked to derived ETH.
   */
  nearAccountId(): string {
    return this.mpcContract.connectedAccount.accountId;
  }

  /**
   * Retrieves the balance of the Ethereum address associated with this adapter.
   *
   * @param {number} chainId - The chain ID of the Ethereum network to query.
   * @returns {Promise<bigint>} - A promise that resolves to the balance of the address in wei.
   */
  async getBalance(chainId: number): Promise<bigint> {
    const network = Network.fromChainId(chainId);
    return network.client.getBalance({ address: this.address });
  }

  /**
   * Constructs an EVM instance with the provided configuration.
   * @param {AdapterParams} args - The configuration object for the Adapter instance.
   */
  static async fromConfig(args: AdapterParams): Promise<NearEthAdapter> {
    // Sender is uniquely determined by the derivation path!
    const mpcContract = args.mpcContract;
    const derivationPath = args.derivationPath || "ethereum,1";
    return new NearEthAdapter({
      sender: await mpcContract.deriveEthAddress(derivationPath),
      derivationPath,
      mpcContract,
    });
  }

  /**
   * Takes a minimally declared Ethereum Transaction,
   * builds the full transaction payload (with gas estimates, prices etc...),
   * acquires signature from Near MPC Contract and submits transaction to public mempool.
   *
   * @param {BaseTx} txData - Minimal transaction data to be signed by Near MPC and executed on EVM.
   * @param {bigint} nearGas - manually specified gas to be sent with signature request.
   * Note that the signature request is a recursive function.
   */
  async signAndSendTransaction(
    txData: BaseTx,
    nearGas?: bigint
  ): Promise<Hash> {
    const { transaction, signArgs } = await this.createTxPayload(txData);
    console.log(`Requesting signature from ${this.mpcContract.accountId()}`);
    const signature = await this.mpcContract.requestSignature(
      signArgs,
      nearGas
    );
    return this.relayTransaction({ transaction, signature });
  }

  /**
   * Takes a minimally declared Ethereum Transaction,
   * builds the full transaction payload (with gas estimates, prices etc...),
   * acquires signature from Near MPC Contract and submits transaction to public mempool.
   *
   * @param {BaseTx} txData - Minimal transaction data to be signed by Near MPC and executed on EVM.
   * @param {bigint} nearGas - manually specified gas to be sent with signature request.
   * Note that the signature request is a recursive function.
   */
  async getSignatureRequestPayload(
    txData: BaseTx,
    nearGas?: bigint
  ): Promise<{
    transaction: Hex;
    requestPayload: FunctionCallTransaction<{ request: SignArgs }>;
  }> {
    const { transaction, signArgs } = await this.createTxPayload(txData);
    return {
      transaction,
      requestPayload: this.mpcContract.encodeSignatureRequestTx(
        signArgs,
        nearGas
      ),
    };
  }

  /**
   * Builds a Near Transaction Payload for Signing serialized EVM Transaction.
   * @param {Hex} transaction RLP encoded (i.e. serialized) Ethereum Transaction
   * @param nearGas optional gas parameter
   * @returns {FunctionCallTransaction<SignArgs>} Prepared Near Transaction with signerId as this.address
   */
  mpcSignRequest(
    transaction: Hex,
    nearGas?: bigint
  ): FunctionCallTransaction<{ request: SignArgs }> {
    return this.mpcContract.encodeSignatureRequestTx(
      {
        payload: buildTxPayload(transaction),
        path: this.derivationPath,
        key_version: 0,
      },
      nearGas
    );
  }

  /**
   * Relays valid representation of signed transaction to Etherem mempool for execution.
   *
   * @param {TransactionWithSignature} tx - Signed Ethereum transaction.
   * @returns Hash of relayed transaction.
   */
  async relayTransaction(tx: TransactionWithSignature): Promise<Hash> {
    const signedTx = addSignature(tx);
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
  async createTxPayload(tx: BaseTx): Promise<TxPayload> {
    console.log(
      `Creating payload for sender: ${this.nearAccountId()} <> ${this.address}`
    );
    const transaction = await this.buildTransaction(tx);
    console.log("Built (unsigned) Transaction", transaction);
    const signArgs = {
      payload: buildTxPayload(transaction),
      path: this.derivationPath,
      key_version: 0,
    };
    return { transaction, signArgs };
  }

  /**
   * Transforms minimal transaction request data into a fully populated EVM transaction.
   * @param {BaseTx} tx - Minimal transaction request data
   * @returns {Hex} serialized (aka RLP encoded) transaction.
   */
  async buildTransaction(tx: BaseTx): Promise<Hex> {
    const transaction = await populateTx(tx, this.address);
    console.log("Transaction Request", transaction);
    return serializeTransaction(transaction);
  }

  /**
   * Relays signed transaction to Ethereum mem-pool for execution.
   * @param serializedTransaction - Signed Ethereum transaction.
   * @returns Transaction Hash of relayed transaction.
   */
  async relaySignedTransaction(
    serializedTransaction: Hex,
    wait: boolean = true
  ): Promise<Hash> {
    const tx = parseTransaction(serializedTransaction);
    const network = Network.fromChainId(tx.chainId!);
    if (wait) {
      const hash = await network.client.sendRawTransaction({
        serializedTransaction,
      });
      console.log(`Transaction Confirmed: ${network.scanUrl}/tx/${hash}`);
      return hash;
    } else {
      network.client.sendRawTransaction({
        serializedTransaction,
      });
      return keccak256(serializedTransaction);
    }
  }
  // Below code is inspired by https://github.com/Connor-ETHSeoul/near-viem

  async signTypedData<
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | "EIP712Domain" = keyof typedData,
  >(typedData: TypedDataDefinition<typedData, primaryType>): Promise<Hash> {
    return this.sign(hashTypedData(typedData));
  }

  async signMessage(message: SignableMessage): Promise<Hash> {
    return this.sign(hashMessage(message));
  }

  /**
   * Requests signature from Near MPC Contract.
   * @param msgHash - Message Hash to be signed.
   * @returns Two different potential signatures for the hash (one of which is valid).
   */
  async sign(msgHash: `0x${string}` | Uint8Array): Promise<Hex> {
    const signature = await this.mpcContract.requestSignature({
      path: this.derivationPath,
      payload: toPayload(msgHash),
      key_version: 0,
    });
    return serializeSignature(signature);
  }

  /// Mintbase Wallet
  async handleSessionRequest(
    request: Partial<Web3WalletTypes.SessionRequest>
  ): Promise<NearEthTxData> {
    const {
      chainId,
      request: { method, params },
    } = request.params!;
    console.log(`Session Request of type ${method} for chainId ${chainId}`);
    const { evmMessage, payload, recoveryData } = await wcRouter(
      method,
      chainId,
      params
    );
    console.log("Parsed Request:", payload, recoveryData);
    return {
      nearPayload: this.mpcContract.encodeSignatureRequestTx({
        path: this.derivationPath,
        payload,
        key_version: 0,
      }),
      evmMessage,
      recoveryData,
    };
  }

  async wcRespond(
    recoveryData: RecoveryData,
    signature: Signature
  ): Promise<Hex> {
    if (recoveryData.type === "eth_sendTransaction") {
      const signedTx = addSignature({
        transaction: recoveryData.data as Hex,
        signature,
      });
      // Returns relayed transaction hash (without waiting for confirmation).
      return this.relaySignedTransaction(signedTx, false);
    }
    return serializeSignature(signature);
  }
}
