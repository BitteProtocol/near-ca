import { Common } from "@ethereumjs/common";
import { ethers } from "ethers";
import Web3 from "web3";

const config = {
  chainId: 11155111,
  // providerUrl: "https://rpc.sepolia.ethpandaops.io",
  // providerUrl: "https://sepolia.gateway.tenderly.co",
  providerUrl: "https://rpc2.sepolia.org",
  chain: "sepolia",
};

export const web3 = new Web3(config.providerUrl);
export const common = new Common({ chain: config.chain });
export const provider = new ethers.JsonRpcProvider(
  config.providerUrl,
  config.chainId
);
