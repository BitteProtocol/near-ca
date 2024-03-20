import { signAndSendTransaction } from "../src/chains/ethereum";
import { encodeFunctionData } from "viem";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();

  const data = encodeFunctionData({
    abi: ["function safeMint(address to)"],
    functionName: "safeMint",
    args: ["0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA"],
  });

  await signAndSendTransaction(
    sender,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0,
    data
  );
};

run();
