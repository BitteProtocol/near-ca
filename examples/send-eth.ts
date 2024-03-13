import { signAndSendTransaction } from "../src/chains/ethereum";
import dotenv from "dotenv";
import { setupAccount } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const sender = await setupAccount();

  await signAndSendTransaction(
    sender,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0.0001
  );
};

run();
