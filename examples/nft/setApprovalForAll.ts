import erc721ABI from "./abis/ERC721.json";
import { encodeFunctionData } from "viem";
import { setupNearEthAdapter } from "./setup";

const run = async (): Promise<void> => {
  const neareth = await setupNearEthAdapter();
  const value = 0;
  const tokenAddress = "0xe66be37f6b446079fe71a497312996dff6bd963f";
  const operator = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  await neareth.signAndSendTransaction({
    receiver: tokenAddress,
    amount: value,
    data: encodeFunctionData({
      abi: erc721ABI,
      functionName: "setApprovalForAll",
      args: [operator, true],
    }),
  });
};

run();
