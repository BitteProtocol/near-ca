import { parseEther } from "ethers";
import { signAndSendTransaction } from "../src/chains/ethereum";
import { wethInterface } from "../src/utils/interfaces";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const ethAmount = 0.01;
  const callData = wethInterface().encodeFunctionData("withdraw", [
    parseEther(ethAmount.toString()),
  ]);
  await signAndSendTransaction(sender, sepoliaWETH, 0, callData);
};

run();
