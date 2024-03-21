import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { Address, Hex } from "viem";
import { MultichainContract } from "./mpcContract";

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
  // A instance of the NearMPC contract connected to the associated near account.
  mpcContract: MultichainContract;
  /// path used to generate ETH account from Near account (e.g. "ethereum,1")
  derivationPath?: string;
}

export interface GasPrices {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface TxPayload {
  transaction: FeeMarketEIP1559Transaction;
  payload: number[];
}
