import { Chain, createPublicClient, http, PublicClient } from "viem";
import {
  arbitrum,
  base,
  blast,
  gnosis,
  holesky,
  localhost,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from "viem/chains";

// All supported networks
const SUPPORTED_NETWORKS = createNetworkMap([
  base,
  blast,
  mainnet,
  gnosis,
  sepolia,
  holesky,
  arbitrum,
  optimism,
  optimismSepolia,
  localhost,
]);

interface NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
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

  constructor({ name, rpcUrl, chainId, scanUrl }: NetworkFields) {
    const network = SUPPORTED_NETWORKS[chainId]!;

    this.name = name;
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.scanUrl = scanUrl;
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });
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
    };
  });

  return networkMap;
}
