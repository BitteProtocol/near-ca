import { MultichainContract } from "../mpcContract";
import { FunctionCallAction } from "@near-wallet-selector/core";
import { Hex } from "viem";

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

/**
 * Sufficient data required to construct a signed Ethereum Transaction.
 */
export interface TransactionWithSignature {
  /// Unsigned Ethereum transaction data.
  transaction: Hex;
  /// Representation of the transaction's signature.
  signature: MPCSignature;
}
