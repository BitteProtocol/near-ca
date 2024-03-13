import {
  signAndSendTransaction,
  web3,
} from "../src/chains/ethereum";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const functionSignature = web3.eth.abi.encodeFunctionCall(
    {
      name: "safeMint",
      type: "function",
      inputs: [
        {
          type: "address",
          name: "to",
        },
      ],
    },
    ["0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA"]
  );

  await signAndSendTransaction(
    sender,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0,
    functionSignature
  );
};

run();
