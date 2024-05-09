import dotenv from "dotenv";
import { MultichainContract, NearEthAdapter } from "../src";

// This is Sepolia, but can be replaced with nearly any EVM network.
export const SEPOLIA_CHAIN_ID = 11_155_111;

export async function setupNearEthAdapter(): Promise<NearEthAdapter> {
  dotenv.config();
  return NearEthAdapter.fromConfig({
    mpcContract: await MultichainContract.fromEnv(),
    derivationPath: "ethereum,1",
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
