import { Chain, createPublicClient, http, PublicClient } from "viem";
import * as chains from "viem/chains";

// We support all networks exported by viem
const SUPPORTED_NETWORKS = createNetworkMap(Object.values(chains));

interface NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
  logo?: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
    wrappedAddress: string;
    icon?: string;
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
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
    wrappedAddress: string;
    icon?: string;
  };
  logo: string;

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
    this.logo = logo || "";
    this.nativeCurrency = nativeCurrency;
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
    networkMap[network.id] = {
      name: network.name,
      rpcUrl: network.rpcUrls.default.http[0]!,
      chainId: network.id,
      scanUrl: network.blockExplorers?.default.url || "",
      nativeCurrency: {
        ...network.nativeCurrency,
        wrappedAddress: CHAIN_INFO[network.id]?.wrappedToken || "",
      },
      logo:
        CHAIN_INFO[network.id]?.logo || `/${network.nativeCurrency.symbol}.svg`,
    };
  });

  return networkMap;
}

// A short list of networks with known wrapped tokens.
const CHAIN_INFO: {
  [key: number]: { logo?: string; wrappedToken: string };
} = {
  11155111: {
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=014",
    wrappedToken: "0xD0A1E359811322d97991E03f863a0C30C2cF029C",
  },
  1: {
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=014",
    wrappedToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  100: {
    logo: "https://cryptologos.cc/logos/gnosis-gno-logo.svg?v=014",
    wrappedToken: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
  },
  137: {
    wrappedToken: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  },
  42161: {
    wrappedToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  10: {
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
  8453: {
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
};
