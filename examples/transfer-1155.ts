import { signAndSendTransaction } from "../src/chains/ethereum";
import { erc1155Interface } from "../src/utils/interfaces";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const value = 0;
  // TODO retrieve from user:
  const tokenAddress = "0x284c37b0fcb72034ff25855da57fcf097b255474";
  const tokenId = 1;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  const callData = erc1155Interface().encodeFunctionData(
    "safeTransferFrom(address,address,uint256,uint256,bytes)",
    [sender, to, tokenId, 1, "0x"]
  );

  await signAndSendTransaction(sender, tokenAddress, value, callData);
};

run();
