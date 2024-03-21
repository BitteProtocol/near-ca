import wethABI from "./abis/WETH.json";
import { encodeFunctionData, parseEther } from "viem";
import { setupNearEthConnection } from "./setup";

const run = async (): Promise<void> => {
  const evm = await setupNearEthConnection();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const ethAmount = 0.01;
  const callData = encodeFunctionData({
    abi: wethABI,
    functionName: "withdraw",
    args: [parseEther(ethAmount.toString())],
  });

  await evm.signAndSendTransaction({
    receiver: sepoliaWETH,
    amount: 0,
    data: callData,
  });
};

run();
