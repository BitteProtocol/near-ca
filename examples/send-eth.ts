import {
  deriveEthAddress,
  signAndSendTransaction
} from "../src/chains/ethereum";
import dotenv from "dotenv";
dotenv.config();

const run = async (): Promise<void> => {
  const ethAddress = await deriveEthAddress("ethereum,1");

  await signAndSendTransaction(
    ethAddress,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0.001
  );
};

run().then(() => console.log("Done!"));
