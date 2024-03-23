import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { Address, Hex } from "viem";
import { MultichainContract } from "./mpcContract";
import { FunctionCallAction } from "@near-wallet-selector/core";
import BN from "bn.js";

export interface BaseTx {
  /// Recipient of the transaction
  receiver: Address;
  /// ETH value of transaction
  amount: number;
  /// Call Data of the transaction
  data?: Hex;
}

export interface NearEthAdapterParams {
  /// Near configuration.
  near: NearParams;
  /// EVM configuration.
  evm: EvmParams;
}

export interface EvmParams {
  /// The URL of the Ethereum JSON RPC provider.
  providerUrl: string;
  /// The base URL of the blockchain explorer.
  scanUrl: string;
  /// The base URL of the blockchain gas station.
  gasStationUrl: string;
}

export interface NearParams {
  /// An instance of the NearMPC contract connected to the associated near account.
  mpcContract: MultichainContract;
  /// path used to generate ETH account from Near account (e.g. "ethereum,1")
  derivationPath?: string;
}

export interface GasPrices {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/// Near Contract Type for change methods
export interface ChangeMethodArgs<T> {
  /// Change method function agruments.
  args: T;
  /// GasLimit on transaction execution.
  gas: BN;
  /// Deposit (i.e. payable amount) to attach to transaction.
  attachedDeposit: BN;
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
  /// Deserialized Ethereum Transaction.
  transaction: FeeMarketEIP1559Transaction;
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
  transaction: FeeMarketEIP1559Transaction;
  /// Representation of the transaction's signature.
  signature: MPCSignature;
}
