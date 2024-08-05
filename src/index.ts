import { KeyPair } from "near-api-js";
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
  const { accountId, privateKey, mpcContractId, derivationPath } = args;
  // Load near config from provided accountId if not provided
  const config = args.network ?? configFromNetworkId(getNetworkId(accountId));
  if (getNetworkId(accountId) !== config.networkId) {
    throw new Error(
      `AccountId ${accountId} differs from networkId ${config.networkId}`
    );
  }

  const account = await createNearAccount(
    accountId,
    config,
    privateKey ? KeyPair.fromString(privateKey) : undefined
  );
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(account, mpcContractId),
    derivationPath: derivationPath || "ethereum,1",
  });
}
