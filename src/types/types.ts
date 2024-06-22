import { MultichainContract } from "../mpcContract";
// import { FunctionCallAction } from "@near-wallet-selector/core";
import { Hex, SignableMessage, TransactionSerializable } from "viem";

/**
 * Borrowed from @near-wallet-selector/core
 * https://github.com/near/wallet-selector/blob/01081aefaa3c96ded9f83a23ecf0d210a4b64590/packages/core/src/lib/wallet/transactions.types.ts#L12
 */
export interface FunctionCallAction {
  type: "FunctionCall";
  params: {
    methodName: string;
    args: object;
    gas: string;
    deposit: string;
  };
}

export interface BaseTx {
  /// Recipient of the transaction
  to: `0x${string}`;
  /// ETH value of transaction
  value?: bigint;
  /// Call Data of the transaction
  data?: `0x${string}`;
  /// integer ID of the network for the transaction.
  chainId: number;
  /// Specified transaction nonce
  nonce?: number;
  /// optional gasLimit
  gas?: bigint;
}

export interface NearEthAdapterParams {
  /// An instance of the NearMPC contract connected to the associated near account.
  mpcContract: MultichainContract;
  /// path used to generate ETH account from Near account (e.g. "ethereum,1")
  derivationPath?: string;
}

export interface NearEthTxData {
  evmMessage: string | TransactionSerializable;
  nearPayload: NearContractFunctionPayload;
  recoveryData: RecoveryData;
}

export interface GasPrices {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/**
 * Arguments required for signature request from MPC Contract
 * cf. https://github.com/near/mpc-recovery/blob/ac040bcbb31ba9362a6641a5899647105a53ee4a/contract/src/lib.rs#L297-L320
 */
export interface SignArgs {
  /// Derivation Path of for ETH account associated with Near AccountId
  path: string;
  /// Serialized Ethereum Transaction Bytes.
  payload: number[];
  /// version number associated with derived ETH Address (must be increasing).
  key_version: number;
}

export interface TxPayload {
  /// Serialized Ethereum Transaction.
  transaction: Hex;
  /// Arguments required by Near MPC Contract signature request.
  signArgs: SignArgs;
}

export interface NearContractFunctionPayload {
  /// Signer of function call.
  signerId: string;
  /// Transaction Recipient (a Near ContractId).
  receiverId: string;
  /// Function call actions.
  actions: Array<FunctionCallAction>;
}

/**
 * Result Type of MPC contract signature request.
 * Representing Affine Points on eliptic curve.
 */
export interface MPCSignature {
  big_r: string;
  big_s: string;
}

export interface MessageData {
  address: Hex;
  message: SignableMessage;
}

export interface TypedMessageData {
  address: Hex;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  types: any;
  primaryType: any;
  message: any;
  domain: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export interface RecoveryData {
  // TODO use enum!
  type: string;
  data: MessageData | TypedMessageData | Hex;
}

/**
 * Sufficient data required to construct a signed Ethereum Transaction.
 */
export interface TransactionWithSignature {
  /// Unsigned Ethereum transaction data.
  transaction: Hex;
  /// Representation of the transaction's signature.
  signature: MPCSignature;
}
