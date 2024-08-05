import dotenv from "dotenv";
import { NearEthAdapter, setupAdapter } from "../src";

// This is Sepolia, but can be replaced with nearly any EVM network.
export const SEPOLIA_CHAIN_ID = 11_155_111;

export async function setupNearEthAdapter(): Promise<NearEthAdapter> {
  dotenv.config();
  return setupAdapter({
    accountId: process.env.NEAR_ACCOUNT_ID!,
    privateKey: process.env.NEAR_ACCOUNT_PRIVATE_KEY!,
    mpcContractId: process.env.MPC_CONTRACT_ID!,
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
