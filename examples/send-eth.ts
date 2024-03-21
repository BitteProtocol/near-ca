import dotenv from "dotenv";
import { setupNearEthAdapter } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  await evm.signAndSendTransaction({
    receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
    amount: 0.00001,
  });
};

run();
