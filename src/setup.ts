import { Account, KeyPair } from "near-api-js";
import { MpcContract } from "./mpcContract";
import {
  configFromNetworkId,
  createNearAccount,
  getNetworkId,
  NearEthAdapter,
} from "./chains";
import { isKeyPairString, SetupConfig } from "./types";

/**
 * Sets up the NEAR-Ethereum adapter using the provided configuration
 *
 * This function establishes a connection to the NEAR network using the given
 * account details, configures the Multi-Party Computation (MPC) contract, and
 * returns an instance of the NearEthAdapter.
 *
 * @param args - The configuration parameters for setting up the adapter
 * @returns An instance of NearEthAdapter configured with the provided settings
 * @throws Error if the `accountId` does not match the networkId of the provided or inferred `network`
 * @throws Error if there is a failure in creating a NEAR account
 */
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
      privateKey && isKeyPairString(privateKey)
        ? KeyPair.fromString(privateKey)
        : undefined
    );
  } catch (error: unknown) {
    console.error(`Failed to create NEAR account: ${error}`);
    throw error;
  }
  return NearEthAdapter.fromConfig({
    mpcContract: new MpcContract(account, mpcContractId, args.rootPublicKey),
    derivationPath: derivationPath,
  });
}
