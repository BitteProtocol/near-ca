import { Account, KeyPair } from "near-api-js";
import { NearEthAdapter } from "./chains/ethereum";
import { MpcContract } from "./mpcContract";
import { NearConfig } from "near-api-js/lib/near";
import {
  configFromNetworkId,
  createNearAccount,
  getNetworkId,
} from "./chains/near";

export * from "./chains/ethereum";
export * from "./chains/near";
export * from "./mpcContract";
export * from "./network";
export * from "./types";
export * from "./utils";
/// Beta features
export * from "./beta";

type KeyPairString = `ed25519:${string}` | `secp256k1:${string}`;

/**
 * Configuration for setting up the adapter.
 *
 * @property {string} accountId - The NEAR account ID.
 * @property {string} mpcContractId - The MPC contract ID.
 * @property {NearConfig} [network] - (Optional) The NEAR network configuration.
 * @property {string} [privateKey] - (Optional) The private key for the account.
 * @property {string} [derivationPath] - (Optional) The derivation path for the Ethereum account. Defaults to "ethereum,1".
 */
export interface SetupConfig {
  accountId: string;
  mpcContractId: string;
  network?: NearConfig;
  privateKey?: string;
  derivationPath?: string;
  rootPublicKey?: string;
}

/**
 * Sets up the NEAR-Ethereum adapter using the provided configuration.
 *
 * This function establishes a connection to the NEAR network using the given
 * account details, configures the Multi-Party Computation (MPC) contract, and
 * returns an instance of the NearEthAdapter.
 *
 * @param {SetupConfig} args - The configuration parameters for setting up the adapter.
 *
 * @returns {Promise<NearEthAdapter>} - A promise that resolves to an instance of NearEthAdapter configured with the provided settings.
 *
 * @throws {Error} - Throws an error if the `accountId` does not match the networkId of the provided or inferred `network`.
 * @throws {Error} - Throws an error if there is a failure in creating a NEAR account.
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
      privateKey ? KeyPair.fromString(privateKey as KeyPairString) : undefined
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
