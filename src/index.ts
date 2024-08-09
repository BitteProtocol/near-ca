import { Account, KeyPair } from "near-api-js";
import { NearEthAdapter } from "./chains/ethereum";
import { MultichainContract as MpcContract } from "./mpcContract";
import { NearConfig } from "near-api-js/lib/near";
import {
  configFromNetworkId,
  createNearAccount,
  getNetworkId,
} from "./chains/near";

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
      `accountId ${accountId} doesn't match the networkId ${config.networkId}. Please ensure that your accountId is correct and corresponds to the intended network.`
    );
  }

  let account: Account;
  try {
    account = await createNearAccount(
      accountId,
      config,
      // Without private key, MPC contract connection is read-only.
      privateKey ? KeyPair.fromString(privateKey) : undefined
    );
  } catch (error: unknown) {
    console.error(`Failed to create NEAR account: ${error}`);
    throw error;
  }
  return NearEthAdapter.fromConfig({
    mpcContract: new MpcContract(account, mpcContractId),
    derivationPath: derivationPath,
  });
}
