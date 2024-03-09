import {
  deriveEthAddress,
  signAndSendTransaction
} from "../src/chains/ethereum";

const run = async () => {
  const ethAddress = await deriveEthAddress("ethereum,1");

  await signAndSendTransaction(
    ethAddress,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0.001
  );
};

run();
