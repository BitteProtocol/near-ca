import erc721ABI from "./abis/ERC721.json";
import { encodeFunctionData } from "viem";
import { setupNearEthConnection } from "./setup";

const run = async (): Promise<void> => {
  const evm = await setupNearEthConnection();
  const amount = 0;
  // TODO retrieve from user:
  const tokenAddress = "0xb5EF4EbB25fCA7603C028610ddc9233d399dA34d";
  const tokenId = 17;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  const callData = encodeFunctionData({
    abi: erc721ABI,
    functionName: "safeTransferFrom(address,address,uint256)",
    args: [evm.sender, to, tokenId],
  });

  await evm.signAndSendTransaction({
    receiver: tokenAddress,
    amount,
    data: callData,
  });
};

run();
