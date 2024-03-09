import {
  deriveEthAddress,
  signAndSendTransaction,
  web3,
} from "../src/chains/ethereum";

const run = async () => {
  const ethAddress = await deriveEthAddress("ethereum,1");
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
    ethAddress,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0,
    functionSignature
  );
};

run();
