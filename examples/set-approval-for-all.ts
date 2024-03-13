import { signAndSendTransaction } from "../src/chains/ethereum";
import { erc721Interface } from "../src/utils/interfaces";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const value = 0;
  const tokenAddress = "0xe66be37f6b446079fe71a497312996dff6bd963f";
  const operator = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";
  const callData = erc721Interface().encodeFunctionData("setApprovalForAll", [
    operator,
    true,
  ]);

  await signAndSendTransaction(sender, tokenAddress, value, callData);
};

run();
