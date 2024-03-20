import dotenv from "dotenv";
import { Address } from "viem";
import { deriveEthAddress } from "../src/chains/ethereum";
dotenv.config();

export async function setupAccount(): Promise<Address> {
  return deriveEthAddress("ethereum,1");
}
