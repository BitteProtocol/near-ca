import dotenv from "dotenv";
import { setupNearEthAdapter } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  const { to, value } = { to: evm.address, value: 1n };
  // MULTI-SEND!
  const transactions = [
    { to, value, chainId: 11155111 },
    { to, value, chainId: 1301 },
  ];
  await evm.signAndSendTransaction(transactions);
};

run();
