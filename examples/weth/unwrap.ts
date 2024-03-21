import wethABI from "../abis/WETH.json";
import { encodeFunctionData, parseEther } from "viem";
import { setupNearEthAdapter } from "../setup";

const run = async (): Promise<void> => {
  const neareth = await setupNearEthAdapter();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const withdrawAmount = 0.001;

  await neareth.signAndSendTransaction({
    receiver: sepoliaWETH,
    // No eth is "attached" to a WETH withdraw.
    amount: 0,
    data: encodeFunctionData({
      abi: wethABI,
      functionName: "withdraw",
      args: [parseEther(withdrawAmount.toString())],
    }),
  });
};

run();
