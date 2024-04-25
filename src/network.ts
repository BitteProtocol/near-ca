import { Chain, createPublicClient, http, PublicClient } from "viem";
import { sepolia, mainnet, gnosis, holesky } from "viem/chains";

// All supported networks
const SUPPORTED_NETWORKS = createNetworkMap([
  mainnet,
  gnosis,
  sepolia,
  holesky,
]);

interface NetworkFields {
  name: string;
  rpcUrl: string;
  chainId: number;
  scanUrl: string;
  gasStationUrl: string;
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
  gasStationUrl: string;
  client: PublicClient;

  constructor({
    name,
    rpcUrl,
    chainId,
    scanUrl,
    gasStationUrl,
  }: NetworkFields) {
    const network = SUPPORTED_NETWORKS[chainId];

    this.name = name;
    this.rpcUrl = rpcUrl;
    this.chainId = chainId;
    this.scanUrl = scanUrl;
    this.gasStationUrl = gasStationUrl;
    this.client = createPublicClient({
      transport: http(network.rpcUrl),
    });
  }

  /// Returns Network by ChainId
  static fromChainId(chainId: number): Network {
    const networkFields = SUPPORTED_NETWORKS[chainId];
    return new Network(networkFields);
  }
}

type NetworkMap = { [key: number]: NetworkFields };

/**
 * This function is currently limited to networks supported by:
 * https://status.beaconcha.in/
 */
function gasStationUrl(network: Chain): string {
  if (network.id === 1) {
    return "https://beaconcha.in/api/v1/execution/gasnow";
  }
  return `https://${network.name.toLowerCase()}.beaconcha.in/api/v1/execution/gasnow`;
}

/// Dynamically generate network map accessible by chainId.
function createNetworkMap(supportedNetworks: Chain[]): NetworkMap {
  const networkMap: NetworkMap = {};
  supportedNetworks.forEach((network) => {
    networkMap[network.id] = {
      name: network.name,
      rpcUrl: network.rpcUrls.default.http[0],
      chainId: network.id,
      scanUrl: network.blockExplorers?.default.url || "",
      gasStationUrl: gasStationUrl(network),
    };
  });

  return networkMap;
}
