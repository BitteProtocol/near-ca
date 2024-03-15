import { signAndSendTransaction } from "../src/chains/ethereum";
import { setupAccount } from "./setup";

const run = async (): Promise<void> => {
  const sender = await setupAccount();
  const seaportAddress = "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC";
  const salePrice = 0.1;
  const callData = "<PASTE HEX FROM METAMASK HERE>";

  await signAndSendTransaction(sender, seaportAddress, salePrice, callData);
};

run();
