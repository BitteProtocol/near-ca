import { GasPriceResponse } from "../types";

export const getFirstNonZeroGasPrice = (
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
