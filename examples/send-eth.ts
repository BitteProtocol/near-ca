import dotenv from "dotenv";
import { SEPOLIA_CHAIN_ID, setupNearEthAdapter } from "./setup";
dotenv.config();

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  await evm.signAndSendTransaction({
    to: "0xdeADBeeF0000000000000000000000000b00B1e5",
    // THIS IS ONE WEI!
    value: 1n,
    chainId: SEPOLIA_CHAIN_ID,
  });
};

run();
