import { Chain, createPublicClient, http, PublicClient } from "viem";
import * as chains from "viem/chains";
import { CHAIN_INFO } from "./constants";

/** Custom RPC endpoint overrides for specific chain IDs */
const rpcOverrides: { [key: number]: string } = {
  43114: "https://avalanche.drpc.org",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
};

/** Map of all supported networks exported by viem */
const SUPPORTED_NETWORKS = createNetworkMap(Object.values(chains));

/** Interface defining the required fields for a network configuration */
export interface NetworkFields {
  /** Display name of the network */
  name: string;
  /** RPC endpoint URL */
  rpcUrl: string;
  /** Unique chain identifier */
  chainId: number;
  /** Block explorer URL */
  scanUrl: string;
  /** Network logo URL */
  icon: string | undefined;
  /** Whether this is a test network */
  testnet: boolean;
  /** Native currency information */
  nativeCurrency: {
    /** Number of decimal places */
    decimals: number;
    /** Full name of the currency */
    name: string;
    /** Currency symbol */
    symbol: string;
    /** Address of wrapped token contract */
    wrappedAddress: string | undefined;
    /** Currency logo URL (may differ from network icon) */
    icon: string | undefined;
  };
}

/** Interface defining optional configuration overrides for a Network instance */
interface NetworkOptions {
  /** Override the default RPC URL */
  rpcUrl?: string;
  /** Override the default block explorer URL */
  scanUrl?: string;
}

/**
 * Network class that provides access to network-specific data and functionality
 * Leverages network data provided through viem to make all relevant network fields
 * accessible dynamically by chain ID.
 */
export class Network implements NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
  client: PublicClient;
  icon: string | undefined;
  testnet: boolean;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
    wrappedAddress: string | undefined;
    icon: string | undefined;
  };

  /**
   * Creates a new Network instance
   *
   * @param fields - Network configuration fields
   */
  constructor({
    name,
    rpcUrl,
    chainId,
    scanUrl,
    nativeCurrency,
    icon,
  }: NetworkFields) {
    const network = SUPPORTED_NETWORKS[chainId]!;

    this.name = name;
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.scanUrl = scanUrl;
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });
    this.testnet = network.testnet;
    this.nativeCurrency = nativeCurrency;
    this.icon = icon;
  }

  /**
   * Creates a Network instance from a chain ID
   *
   * @param chainId - The chain ID to create the network for
   * @param options - Optional configuration overrides
   * @returns A new Network instance
   * @throws Error if the chain ID is not supported
   */
  static fromChainId(chainId: number, options: NetworkOptions = {}): Network {
    const networkFields = SUPPORTED_NETWORKS[chainId];
    if (!networkFields) {
      throw new Error(
        `Network with chainId ${chainId} is not supported.
        Please reach out to the developers of https://github.com/bitteprotocol/near-ca`
      );
    }
    const mergedFields = {
      ...networkFields,
      // Manual Settings.
      rpcUrl: options.rpcUrl || networkFields.rpcUrl,
      scanUrl: options.scanUrl || networkFields.scanUrl,
    };

    return new Network(mergedFields);
  }
}

/** Mapping of chain IDs to their network configurations */
type NetworkMap = { [key: number]: NetworkFields };

/**
 * Creates a map of network configurations indexed by chain ID
 *
 * @param supportedNetworks - Array of Chain objects from viem
 * @returns A map of network configurations
 */
function createNetworkMap(supportedNetworks: Chain[]): NetworkMap {
  const networkMap: NetworkMap = {};
  supportedNetworks.forEach((network) => {
    const chainInfo = CHAIN_INFO[network.id];
    const icon = chainInfo?.icon || `/${network.nativeCurrency.symbol}.svg`;
    networkMap[network.id] = {
      name: network.name,
      rpcUrl: rpcOverrides[network.id] || network.rpcUrls.default.http[0]!,
      chainId: network.id,
      scanUrl: network.blockExplorers?.default.url || "",
      icon,
      testnet: network.testnet || false,
      nativeCurrency: {
        ...network.nativeCurrency,
        wrappedAddress: chainInfo?.wrappedToken,
        icon: chainInfo?.currencyIcon || icon,
      },
    };
  });

  return networkMap;
}

/**
 * Checks if a given chain ID corresponds to a test network
 *
 * @param chainId - The chain ID to check
 * @returns True if the network is a testnet, false otherwise
 */
export function isTestnet(chainId: number): boolean {
  return Network.fromChainId(chainId).testnet;
}
