import { setupNearEthConnection } from "./setup";

const run = async (): Promise<void> => {
  const evm = await setupNearEthConnection();
  const seaportAddress = "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC";
  const salePrice = 0.1;
  const callData = "0x<PASTE HEX FROM METAMASK HERE>";

  await evm.signAndSendTransaction({
    receiver: seaportAddress,
    amount: salePrice,
    data: callData,
  });
};

run();
