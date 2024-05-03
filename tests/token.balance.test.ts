import { sepolia } from "viem/chains";
import {
  getSingleTokenBalance,
  getBalancesForAccount,
} from "../src/token/balance";
import { ethers } from "ethers";
import { SUPPORTED_NETWORKS } from "../src/network";

describe("Transaction Builder Functions", () => {
  it("getBalance", async () => {
    const provider = new ethers.JsonRpcProvider(
      sepolia.rpcUrls.default.http[0]
    );
    const balance = await getSingleTokenBalance(
      "0x0625afb445c3b6b7b929342a04a22599fd5dbb59",
      "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd",
      provider
    );
    console.log(balance);
  });

  it.only("getBalance", async () => {
    const balance = await getBalancesForAccount(
      "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd",
      SUPPORTED_NETWORKS
    );
    console.log(balance);
  });
});
