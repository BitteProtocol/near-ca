import { Account, KeyPair } from "near-api-js";
import { NearEthAdapter } from "./chains/ethereum";
import { MultichainContract } from "./mpcContract";
import { NearConfig } from "near-api-js/lib/near";
import { createNearAccount } from "./chains/near";

export * from "./chains/ethereum";
export * from "./chains/near";
export * from "./mpcContract";
export * from "./types/types";
export * from "./utils/signature";
export * from "./network";
export * from "./utils/transaction";

interface SetupConfig {
  accountId: string;
  mpcContractId: string;
  network?: NearConfig;
  privateKey?: string;
  derivationPath?: string;
}

type NetworkId = "near" | "testnet";

function getNetworkId(accountId: string): NetworkId {
  const networkId = accountId.split(".").pop() || "";
  if (!["near", "testnet"].includes(networkId)) {
    throw new Error(`Invalid network extracted from accountId ${accountId}`);
  }
  return networkId as NetworkId;
}

export function configFromNetworkId(networkId: NetworkId): NearConfig {
  const network = networkId === "near" ? "mainnet" : "testnet";
  return {
    networkId,
    nodeUrl: `https://rpc.${network}.near.org`,
  };
}

export async function setupAdapter(args: SetupConfig): Promise<NearEthAdapter> {
  const {
    accountId,
    privateKey,
    mpcContractId,
    derivationPath = "ethereum,1",
  } = args;
  // Load near config from provided accountId if not provided
  const accountNetwork = getNetworkId(accountId);
  const config = args.network ?? configFromNetworkId(accountNetwork);
  if (accountNetwork !== config.networkId) {
    throw new Error(
      `The accountId ${accountId} does not match the networkId ${config.networkId}. Please ensure that your accountId is correct and corresponds to the intended network.`
    );
  }

  let account: Account;
  try {
    account = await createNearAccount(
      accountId,
      config,
      privateKey ? KeyPair.fromString(privateKey) : undefined
    );
  } catch (error: unknown) {
    console.error(`Failed to create NEAR account: ${error}`);
    throw error;
  }
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(account, mpcContractId),
    derivationPath: derivationPath,
  });
}
