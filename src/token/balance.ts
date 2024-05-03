import { JsonRpcProvider, ethers } from "ethers";
import { NetworkMap } from "../network";
import { TOKEN_LIST } from "./list";

// This function fetches the balance of a specific ERC-20 token for a given address.
export async function getSingleTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: JsonRpcProvider
): Promise<bigint> {
  // Define the ERC-20 token ABI (only the `balanceOf` function is necessary for this task)
  const tokenAbi = ["function balanceOf(address owner) view returns (uint256)"];

  // Create a new ethers Contract instance to interact with the token
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

  // Fetch the token balance
  const balanceWei: bigint = await tokenContract.balanceOf(walletAddress);

  // Convert the balance from wei to a more readable format (assuming it's a standard ERC-20 with 18 decimals)
  return balanceWei;
}

export async function getBalancesForAccount(
  walletAddress: string,
  networks: NetworkMap
): Promise<void> {
  for (const [key, network] of Object.entries(networks)) {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const tokens = TOKEN_LIST[network.chainId];
    console.log(key, network, tokens);
    if (tokens !== undefined) {
      const balances = await Promise.all(
        tokens.map((x) =>
          getSingleTokenBalance(x.address, walletAddress, provider)
        )
      );
      console.log(
        `Processed Balances for Chain ID: ${key}, got balances ${balances}`
      );
    } else {
      console.log(`no tokens for ${network.name}`);
    }
  }
}
