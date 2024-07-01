import dotenv from "dotenv";
import {
  MultichainContract,
  NearEthAdapter,
  nearAccountFromKeyPair,
} from "../src";
import { KeyPair } from "near-api-js";

// This is Sepolia, but can be replaced with nearly any EVM network.
export const SEPOLIA_CHAIN_ID = 11_155_111;
const TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};

export async function setupNearEthAdapter(): Promise<NearEthAdapter> {
  dotenv.config();
  const account = await nearAccountFromKeyPair({
    keyPair: KeyPair.fromString(process.env.NEAR_ACCOUNT_PRIVATE_KEY!),
    accountId: process.env.NEAR_ACCOUNT_ID!,
    network: TESTNET_CONFIG,
  });
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(
      account,
      process.env.NEAR_MULTICHAIN_CONTRACT!
    ),
    // derivationPath: "ethereum,1",
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
