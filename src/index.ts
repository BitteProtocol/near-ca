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

export async function setupNearEthAdapter(
  accountId: string,
  network: NearConfig,
  privateKey?: string,
  mpcContractId?: string,
  derivationPath?: string
): Promise<NearEthAdapter> {
  const account = await createNearAccount(
    accountId,
    network,
    privateKey ? KeyPair.fromString(privateKey) : undefined
  );
  return NearEthAdapter.fromConfig({
    mpcContract: new MultichainContract(account, mpcContractId),
    derivationPath: derivationPath || "ethereum,1",
  });
}
