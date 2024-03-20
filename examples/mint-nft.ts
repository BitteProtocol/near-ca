import { ethers } from "ethers";
import { signAndSendTransaction } from "../src/chains/ethereum";
import { Hex } from "viem";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  // web3js
  // const functionSignature = web3.eth.abi.encodeFunctionCall(
  //   {
  //     name: "safeMint",
  //     type: "function",
  //     inputs: [
  //       {
  //         type: "address",
  //         name: "to",
  //       },
  //     ],
  //   },
  //   ["0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA"]
  // );

  // ethers
  const iface = new ethers.Interface(["function safeMint(address to)"]);
  const functionSignature = iface.encodeFunctionData("safeMint", [
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
  ]) as Hex;

  await signAndSendTransaction(
    sender,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0,
    functionSignature
  );
};

run();
