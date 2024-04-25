import erc721ABI from "../../abis/ERC721.json";
import { encodeFunctionData } from "viem";
import { SEPOLIA_CHAIN_ID, setupNearEthAdapter } from "../../setup";

const run = async (): Promise<void> => {
  const neareth = await setupNearEthAdapter();

  const tokenAddress = "0xb5EF4EbB25fCA7603C028610ddc9233d399dA34d";
  const tokenId = 17;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  await neareth.signAndSendTransaction({
    to: tokenAddress,
    data: encodeFunctionData({
      abi: erc721ABI,
      functionName: "safeTransferFrom(address,address,uint256)",
      args: [neareth.address, to, tokenId],
    }),
    chainId: SEPOLIA_CHAIN_ID,
  });
};

run();
