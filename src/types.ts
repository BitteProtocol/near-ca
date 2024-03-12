import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

export interface GasPriceResponse {
  code: number;
  data: {
      rapid: number;
      fast: number;
      standard: number;
      slow: number;
      timestamp: number;
      price: number;
      priceUSD: number;
  };
}

export interface GasPrices { 
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface TxPayload {
  transaction: FeeMarketEIP1559Transaction, 
  payload: number[]
}