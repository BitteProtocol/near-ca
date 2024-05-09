import {
  keyStores,
  KeyPair,
  connect,
  Account,
  ConnectConfig,
  Near,
} from "near-api-js";
import { Wallet } from "@near-wallet-selector/core";

export const TGAS = 1000000000000n;
export const NO_DEPOSIT = "0";

export const TESTNET_CONFIG: ConnectConfig = {
  networkId: "testnet",
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com/",
  helperUrl: "https://helper.testnet.near.org",
  // This field does not exist on this type, even though its here:
  // https://docs.near.org/tools/near-api-js/wallet
  // explorerUrl: "https://testnet.nearblocks.io",
};

/**
 * Loads Near Account from process.env.
 * Defaults to TESTNET_CONFIG if no network configuration is provided
 * @param network {NearConfig} network settings
 * @returns {Account}
 */
export const nearAccountFromEnv = async (
  network?: ConnectConfig
): Promise<{ near: Near; account: Account }> => {
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
  network?: ConnectConfig;
}): Promise<{ near: Near; account: Account }> => {
  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey("testnet", config.accountId, config.keyPair);
  const near = await connect({
    ...(config.network || TESTNET_CONFIG),
    keyStore,
  });
  const account = await near.account(config.accountId);
  return { near, account };
};

/** Minimally sufficient Account instance to construct the signing contract instance.
 *  Can't be used to change methods.
 */
export const nearAccountFromWallet = async (
  wallet: Wallet,
  network?: ConnectConfig
): Promise<Account> => {
  const keyStore = new keyStores.InMemoryKeyStore();
  const near = await connect({
    ...(network || TESTNET_CONFIG),
    keyStore,
  });
  const accountId = (await wallet.getAccounts())[0].accountId;
  const account = await near.account(accountId);
  return account;
};
