import dotenv from "dotenv";
import { setupNearEthAdapter } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  const message = "Hello World";
  console.log(`Signing "${message}" with ${evm.address}`);

  const signature = await evm.signMessage(message);
  console.log("Got Validated Signature", signature);
};

run();
