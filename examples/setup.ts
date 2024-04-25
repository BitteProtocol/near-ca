import dotenv from "dotenv";
import { MultichainContract, NearEthAdapter, nearAccountFromEnv } from "../src";

export const SEPOLIA_CHAIN_ID = 11_155_111;

export async function setupNearEthAdapter(): Promise<NearEthAdapter> {
  dotenv.config();
  const account = await nearAccountFromEnv();
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(
      account,
      process.env.NEAR_MULTICHAIN_CONTRACT!
    ),
    derivationPath: "ethereum,1",
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
