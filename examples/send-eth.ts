import dotenv from "dotenv";
import { setupNearEthAdapter } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  console.log(evm.address);
  // throw new Error("You foked up");
  const transactions = [
    { to: evm.address, value: 1n, chainId: 97 },
    { to: evm.address, value: 1n, chainId: 1301 },
  ];
  await evm.signAndSendTransaction(transactions);
};

run();
