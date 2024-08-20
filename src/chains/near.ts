import { keyStores, KeyPair, connect, Account } from "near-api-js";
import { NearConfig } from "near-api-js/lib/near";

export const TGAS = 1000000000000n;
export const NO_DEPOSIT = "0";
// Unused amount will be returned to user (apparently).
export const MPC_MAX_DEPOSIT = "50000000000000000000000";

type NetworkId = "mainnet" | "testnet";

/**
 * Extracts the network ID from a given NEAR account ID.
 * If the account ID does not end with "near" or "testnet", it logs a warning.
 * Defaults to "mainnet" if the network ID is not "testnet".
 *
 * @param accountId - The NEAR account ID to extract the network ID from.
 * @returns The network ID, either "mainnet" or "testnet".
 */
export function getNetworkId(accountId: string): NetworkId {
  const accountExt = accountId.split(".").pop() || "";
  if (!["near", "testnet"].includes(accountExt)) {
    console.warn(
      `Unusual or invalid network extracted from accountId ${accountId}`
    );
  }
  // Consider anything that isn't testnet as mainnet.
  return accountExt !== "testnet" ? "mainnet" : accountExt;
}

/**
 * Generates a NEAR configuration object based on the provided network ID.
 *
 * @param networkId - The network ID, either "mainnet" or "testnet".
 * @returns A NearConfig object containing the network ID and node URL.
 */
export function configFromNetworkId(networkId: NetworkId): NearConfig {
  return {
    networkId,
    nodeUrl: `https://rpc.${networkId}.near.org`,
  };
}

/**
 * Loads Near Account from provided keyPair and accountId
 *
 * @param keyPair {KeyPair}
 * @param accountId {string}
 * @param network {NearConfig} network settings
 * @returns A Promise that resolves to a NEAR Account instance.
 */
export const nearAccountFromKeyPair = async (config: {
  keyPair: KeyPair;
  accountId: string;
  network: NearConfig;
}): Promise<Account> => {
  return createNearAccount(config.accountId, config.network, config.keyPair);
};

/** Minimally sufficient Account instance to construct readonly MpcContract connection.
 *  Can't be used to change methods.
 *
 * @param accountId {string}
 * @param network {NearConfig} network settings
 * @returns A Promise that resolves to a NEAR Account instance.
 */
export const nearAccountFromAccountId = async (
  accountId: string,
  network: NearConfig
): Promise<Account> => {
  return createNearAccount(accountId, network);
};

/**
 * Creates a NEAR account instance using the provided account ID, network configuration, and optional key pair.
 *
 * @param accountId - The NEAR account ID.
 * @param network - The NEAR network configuration.
 * @param keyPair - (Optional) The key pair for the account.
 * @returns A Promise that resolves to a NEAR Account instance.
 */
export const createNearAccount = async (
  accountId: string,
  network: NearConfig,
  keyPair?: KeyPair
): Promise<Account> => {
  const keyStore = new keyStores.InMemoryKeyStore();
  if (keyPair) {
    await keyStore.setKey(network.networkId, accountId, keyPair);
  }
  const near = await connect({ ...network, keyStore });
  return near.account(accountId);
};
