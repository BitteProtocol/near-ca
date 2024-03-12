
import dotenv from "dotenv";
import { deriveEthAddress } from "../src/chains/ethereum";
dotenv.config();

export async function setupAccount(): Promise<string> {
  return deriveEthAddress("ethereum,1");
}