import erc721ABI from "../../abis/ERC721.json";
import { encodeFunctionData } from "viem";
import { setupNearEthAdapter } from "../../setup";

const run = async (): Promise<void> => {
  const neareth = await setupNearEthAdapter();

  const amount = 0;
  const tokenAddress = "0xb5EF4EbB25fCA7603C028610ddc9233d399dA34d";
  const tokenId = 17;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  await neareth.signAndSendTransaction({
    receiver: tokenAddress,
    amount,
    data: encodeFunctionData({
      abi: erc721ABI,
      functionName: "safeTransferFrom(address,address,uint256)",
      args: [neareth.sender, to, tokenId],
    }),
  });
};

run();
