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
} from "viem";
import {
  BaseTx,
  AdapterParams,
  FunctionCallTransaction,
  TxPayload,
  SignArgs,
  Network,
  buildTxPayload,
  populateTx,
  toPayload,
  broadcastSignedTransaction,
  SignRequestData,
  IMpcContract,
  NearEncodedSignRequest,
} from "..";
import { Beta } from "../beta";
import { requestRouter } from "../utils/request";
import { Account } from "near-api-js";

export class NearEthAdapter {
  readonly mpcContract: IMpcContract;
  readonly address: Address;
  readonly derivationPath: string;
  readonly beta: Beta;

  private constructor(config: {
    mpcContract: IMpcContract;
    derivationPath: string;
    sender: Address;
  }) {
    this.mpcContract = config.mpcContract;
    this.derivationPath = config.derivationPath;
    this.address = config.sender;
    this.beta = new Beta(this);
  }

  /**
   * @returns Near Account linked to derived EVM account.
   */
  nearAccount(): Account {
    return this.mpcContract.connectedAccount;
  }

  /**
   * @returns Near accountId linked to derived EVM account.
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
   * Constructs an EVM instance with the provided configuration.
   * @param {AdapterParams} args - The configuration object for the Adapter instance.
   */
  static async mocked(args: AdapterParams): Promise<NearEthAdapter> {
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
    return broadcastSignedTransaction({ transaction, signature });
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
      requestPayload: await this.mpcContract.encodeSignatureRequestTx(
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
  async mpcSignRequest(
    transaction: Hex,
    nearGas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>> {
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

  /**
   * Encodes a signature request for submission to the Near-Ethereum transaction MPC contract.
   *
   * @async
   * @function encodeSignRequest
   * @param {SignRequestData} signRequest - The signature request data containing method, chain ID, and parameters.
   * @returns {Promise<NearEthTxData>}
   * - Returns a promise that resolves to an object containing the encoded Near-Ethereum transaction data,
   *   the original EVM message, and recovery data necessary for verifying or reconstructing the signature.
   */
  async encodeSignRequest(
    signRequest: SignRequestData
  ): Promise<NearEncodedSignRequest> {
    const { evmMessage, hashToSign } = await requestRouter(signRequest);
    return {
      nearPayload: await this.mpcContract.encodeSignatureRequestTx({
        path: this.derivationPath,
        payload: toPayload(hashToSign),
        key_version: 0,
      }),
      evmMessage,
      hashToSign,
    };
  }
}
