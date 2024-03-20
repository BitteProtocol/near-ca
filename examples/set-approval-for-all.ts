import { signAndSendTransaction } from "../src/chains/ethereum";
import erc721ABI from "../src/abis/ERC721.json";
import { encodeFunctionData } from "viem";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const value = 0;
  const tokenAddress = "0xe66be37f6b446079fe71a497312996dff6bd963f";
  const operator = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  const callData = encodeFunctionData({
    abi: erc721ABI,
    functionName: "setApprovalForAll",
    args: [operator, true],
  });

  await signAndSendTransaction(sender, tokenAddress, value, callData);
};

run();
