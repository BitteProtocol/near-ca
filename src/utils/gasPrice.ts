import { GasPrices } from "../types/types";

interface GasPriceResponse {
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

export async function queryGasPrice(gasStationUrl: string): Promise<GasPrices> {
  const res = await fetch(gasStationUrl);
  const gasPrices = (await res.json()) as GasPriceResponse;
  const maxPriorityFeePerGas = BigInt(getFirstNonZeroGasPrice(gasPrices)!);

  // Since we don't have a direct `baseFeePerGas`, we'll use a workaround.
  // Ideally, you should fetch the current `baseFeePerGas` from the network.
  // Here, we'll just set a buffer based on `maxPriorityFeePerGas` for demonstration purposes.
  // This is NOT a recommended practice for production environments.
  const buffer = BigInt(2 * 1e9); // Example buffer of 2 Gwei, assuming the API values are in WEI
  const maxFeePerGas = maxPriorityFeePerGas + buffer;
  return { maxFeePerGas, maxPriorityFeePerGas };
}

const getFirstNonZeroGasPrice = (
  response: GasPriceResponse
): number | undefined => {
  // List the properties we're interested in
  const properties: (keyof GasPriceResponse["data"])[] = [
    "rapid",
    "fast",
    "standard",
    "slow",
  ];

  // Iterate through the properties and return the first non-zero value
  for (const property of properties) {
    if (response.data[property] !== 0) {
      return response.data[property];
    }
  }

  // Return undefined if all values are zero or if none are found
  return undefined;
};
