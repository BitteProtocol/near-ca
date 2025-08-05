import { KeyPair, Account, KeyPairSigner } from "near-api-js";
import { JsonRpcProvider, Provider } from "near-api-js/lib/providers";
import { NearConfig } from "near-api-js/lib/near";
import { NearAccountConfig } from "../types";

/** Gas unit constant for NEAR transactions (1 TeraGas) */
export const TGAS = 1000000000000n;

/** Valid NEAR network identifiers */
type NetworkId = "mainnet" | "testnet";

/**
 * Extracts the network ID from a given NEAR account ID
 *
 * @param accountId - The NEAR account ID to analyze
 * @returns The network ID ("mainnet" or "testnet")
 * @remarks If the account ID doesn't end with "near" or "testnet", defaults to "mainnet"
 */
export function getNetworkId(accountId: string): NetworkId {
  const accountExt = accountId.split(".").pop() || "";
  // Consider anything that isn't testnet as mainnet.
  return accountExt !== "testnet" ? "mainnet" : accountExt;
}

/**
 * Generates a NEAR configuration object for a specific network
 *
 * @param networkId - The target network identifier
 * @returns Configuration object for NEAR connection
 */
export function configFromNetworkId(networkId: NetworkId): NearConfig {
  return {
    networkId,
    nodeUrl: `https://rpc.${networkId}.near.org`,
  };
}

/**
 * Creates a NEAR Account instance from provided credentials
 *
 * @param config - Configuration containing account ID, network, and key pair
 * @returns A NEAR Account instance
 */
export const nearAccountFromKeyPair = async (
  config: NearAccountConfig
): Promise<Account> => {
  return createNearAccount(config.accountId, config.network, config.keyPair);
};

/**
 * Creates a read-only NEAR Account instance from an account ID
 *
 * @param accountId - The NEAR account identifier
 * @param network - The NEAR network configuration
 * @returns A read-only NEAR Account instance
 * @remarks This account cannot perform write operations
 */
export const nearAccountFromAccountId = async (
  accountId: string,
  network: NearConfig
): Promise<Account> => {
  return createNearAccount(accountId, network);
};

/**
 * Creates a NEAR Account instance with optional write capabilities
 *
 * @param accountId - The NEAR account identifier
 * @param network - The NEAR network configuration
 * @param keyPair - Optional key pair for write access
 * @returns A NEAR Account instance
 */
export const createNearAccount = async (
  accountId: string,
  network: NearConfig,
  keyPair?: KeyPair
): Promise<Account> => {
  const provider = new JsonRpcProvider({ url: network.nodeUrl }) as Provider;
  return new Account(
    accountId,
    provider,
    keyPair ? KeyPairSigner.fromSecretKey(keyPair.toString()) : undefined
  );
};
