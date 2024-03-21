import { keyStores, KeyPair, connect, Account } from "near-api-js";

export const TGAS = 1000000000000;
export const THIRTY_TGAS = "30000000000000";
export const SIXTY_TGAS = "60000000000000";
export const NINTEY_TGAS = "90000000000000";
export const NO_DEPOSIT = "0";

export interface NearConfig {
  networkId: string;
  nodeUrl: string;
}

const TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};

/**
 * Loads Near Account from process.env.
 * Defaults to TESTNET_CONFIG if no network configuration is provided
 * @param network {NearConfig} network settings
 * @returns {Account}
 */
export const nearAccountFromEnv = async (
  network?: NearConfig
): Promise<Account> => {
  const keyPair = KeyPair.fromString(process.env.NEAR_ACCOUNT_PRIVATE_KEY!);
  return nearAccountFromKeyPair({
    keyPair,
    accountId: process.env.NEAR_ACCOUNT_ID!,
    network,
  });
};

/**
 * Loads Near Account from provided keyPair and accountId
 * Defaults to TESTNET_CONFIG
 * @param keyPair {KeyPair}
 * @param accountId {string}
 * @param network {NearConfig} network settings
 * @returns {Account}
 */
export const nearAccountFromKeyPair = async (config: {
  keyPair: KeyPair;
  accountId: string;
  network?: NearConfig;
}): Promise<Account> => {
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey("testnet", config.accountId, config.keyPair);
  const near = await connect({
    ...(config.network || TESTNET_CONFIG),
    keyStore,
  });
  const account = await near.account(config.accountId);
  return account;
};
