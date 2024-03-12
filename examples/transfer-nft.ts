import {
  signAndSendTransaction
} from "../src/chains/ethereum";
import { erc721Interface } from "../src/utils/interfaces";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const value = 0;
  // TODO retrieve from user:
  const tokenAddress = "0xd4b922e90cb5daa6422ac018acde78dbbe23e4eb";
  const tokenId = 3;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  const callData = erc721Interface().encodeFunctionData("safeTransferFrom(address,address,uint256)", [sender, to, tokenId]);
  
  await signAndSendTransaction(
    sender,
    tokenAddress,
    value,
    callData
  );
};

run();
