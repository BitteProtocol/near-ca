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

interface SetupConfig {
  accountId: string;
  network: NearConfig;
  privateKey?: string;
  mpcContractId?: string;
  derivationPath?: string;
}

export async function setupAdapter(args: SetupConfig): Promise<NearEthAdapter> {
  const { privateKey, mpcContractId, derivationPath } = args;
  const account = await createNearAccount(
    args.accountId,
    args.network,
    privateKey ? KeyPair.fromString(privateKey) : undefined
  );
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(account, mpcContractId),
    derivationPath: derivationPath || "ethereum,1",
  });
}
