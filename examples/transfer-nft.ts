import {
  deriveEthAddress,
  signAndSendTransaction
} from "../src/chains/ethereum";
import { erc721Interface } from "../src/utils/interfaces";

const run = async (): Promise<void> => {
  const sender = await deriveEthAddress("ethereum,1");
  const value = 0;
  // TODO retrieve from user:
  const tokenAddress = "0xe66be37f6b446079fe71a497312996dff6bd963f";
  const tokenId = 2;
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
