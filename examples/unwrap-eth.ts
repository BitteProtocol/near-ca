import { signAndSendTransaction } from "../src/chains/ethereum";
import wethABI from "../src/abis/WETH.json";
import { encodeFunctionData, parseEther } from "viem";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const ethAmount = 0.01;
  const callData = encodeFunctionData({
    abi: wethABI,
    functionName: "withdraw",
    args: [parseEther(ethAmount.toString())],
  });
  await signAndSendTransaction(sender, sepoliaWETH, 0, callData);
};

run();
