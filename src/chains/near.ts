import { keyStores, KeyPair, connect, Account } from "near-api-js";

export const TGAS = 1000000000000n;
export const NO_DEPOSIT = "0";

export interface NearConfig {
  networkId: string;
  nodeUrl: string;
}

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
  network: NearConfig;
}): Promise<Account> => {
  return createNearAccount(config.accountId, config.network, config.keyPair);
};

/** Minimally sufficient Account instance to construct the signing contract instance.
 *  Can't be used to change methods.
 */
export const nearAccountFromAccountId = async (
  accountId: string,
  network: NearConfig
): Promise<Account> => {
  return createNearAccount(accountId, network);
};

const createNearAccount = async (
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
