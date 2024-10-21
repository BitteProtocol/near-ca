import { Chain, createPublicClient, http, PublicClient } from "viem";
import * as chains from "viem/chains";
import { CHAIN_INFO } from "./constants";

// Viem defaults are known to be unreliable.
const rpcOverrides: { [key: number]: string } = {
  43114: "https://rpc.ankr.com/avalanche",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
};

// We support all networks exported by viem
const SUPPORTED_NETWORKS = createNetworkMap(Object.values(chains));

export interface NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  // TODO(bh2smith): Scan data should become structure: viem/types/chain.ts
  scanUrl: string;
  scanApiUrl: string;
  icon: string | undefined;
  testnet: boolean;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
    wrappedAddress: string | undefined;
    // This is often Network logo, but sometimes not (e.g. Gnosis Chain & xDai)
    icon: string | undefined;
  };
}
/**
 * Leveraging Network Data provided from through viem
 * This class makes all relevant network fields accessible dynamically by chain ID.
 */
export class Network implements NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
  scanApiUrl: string;
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

  constructor({
    name,
    rpcUrl,
    chainId,
    scanUrl,
    scanApiUrl,
    nativeCurrency,
    icon,
  }: NetworkFields) {
    const network = SUPPORTED_NETWORKS[chainId]!;

    this.name = name;
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.scanUrl = scanUrl;
    this.scanApiUrl = scanApiUrl;
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });
    this.testnet = network.testnet;
    this.nativeCurrency = nativeCurrency;
    this.icon = icon;
  }

  static fromChainId(
    chainId: number,
    options: { rpcUrl?: string; scanUrl?: string } = {}
  ): Network {
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

type NetworkMap = { [key: number]: NetworkFields };

/// Dynamically generate network map accessible by chainId.
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
      scanApiUrl: network.blockExplorers?.default.apiUrl || "",
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

export function isTestnet(chainId: number): boolean {
  return Network.fromChainId(chainId).testnet;
}
