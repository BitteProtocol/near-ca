import { Chain, createPublicClient, http, PublicClient } from "viem";
import * as chains from "viem/chains";
import { CHAIN_INFO } from "./constants";

// We support all networks exported by viem
const SUPPORTED_NETWORKS = createNetworkMap(Object.values(chains));

export interface NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
  logo: string | undefined;
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
  client: PublicClient;
  logo: string | undefined;
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
    nativeCurrency,
    logo,
  }: NetworkFields) {
    const network = SUPPORTED_NETWORKS[chainId]!;

    this.name = name;
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.scanUrl = scanUrl;
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });
    this.nativeCurrency = nativeCurrency;
    this.logo = logo;
  }

  static fromChainId(chainId: number): Network {
    const networkFields = SUPPORTED_NETWORKS[chainId];
    if (!networkFields) {
      throw new Error(
        `Network with chainId ${chainId} is not supported.
        Please reach out to the developers of https://github.com/Mintbase/near-ca`
      );
    }
    return new Network(networkFields);
  }
}

type NetworkMap = { [key: number]: NetworkFields };

/// Dynamically generate network map accessible by chainId.
function createNetworkMap(supportedNetworks: Chain[]): NetworkMap {
  const networkMap: NetworkMap = {};
  supportedNetworks.forEach((network) => {
    const chainInfo = CHAIN_INFO[network.id];
    const logo = chainInfo?.icon || `/${network.nativeCurrency.symbol}.`;
    networkMap[network.id] = {
      name: network.name,
      rpcUrl: network.rpcUrls.default.http[0]!,
      chainId: network.id,
      scanUrl: network.blockExplorers?.default.url || "",
      logo,
      nativeCurrency: {
        ...network.nativeCurrency,
        wrappedAddress: chainInfo?.wrappedToken,
        icon: chainInfo?.currencyIcon || logo,
      },
    };
  });

  return networkMap;
}
