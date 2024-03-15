import { signAndSendTransaction } from "../src/chains/ethereum";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const sepoliaWETH = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
  const ethAmount = 0.01;
  const deposit = "0xd0e30db0";

  await signAndSendTransaction(sender, sepoliaWETH, ethAmount, deposit);
};

run();
