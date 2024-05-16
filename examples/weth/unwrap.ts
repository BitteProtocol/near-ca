import wethABI from "../abis/WETH.json";
import { encodeFunctionData, parseEther } from "viem";
import { SEPOLIA_CHAIN_ID, setupNearEthAdapter } from "../setup";

const run = async (): Promise<void> => {
  const neareth = await setupNearEthAdapter();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const withdrawAmount = 0.001;

  await neareth.signAndSendTransaction({
    to: sepoliaWETH,
    // No eth is "attached" to a WETH withdraw.
    data: encodeFunctionData({
      abi: wethABI,
      functionName: "withdraw",
      args: [parseEther(withdrawAmount.toString())],
    }),
    chainId: SEPOLIA_CHAIN_ID,
  });
};

run();
