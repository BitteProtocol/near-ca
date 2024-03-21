import dotenv from "dotenv";
import { setupNearEthConnection } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthConnection();

  await evm.signAndSendTransaction({
    receiver: "0x247b317521D7edCfaf9B6D6C21B55217E5c34E0a",
    amount: 0.000001,
  });
};

run();
