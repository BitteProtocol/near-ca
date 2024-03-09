import { keyStores, KeyPair, connect, providers } from "near-api-js";

export const TGAS = 1000000000000;
export const THIRTY_TGAS = "30000000000000";
export const NO_DEPOSIT = "0";

export const nearConfig = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};

export const provider = new providers.JsonRpcProvider({
  url: nearConfig.nodeUrl,
});

export const getNearAccount = async () => {
  const keyStore = new keyStores.InMemoryKeyStore();

  const keyPair = KeyPair.fromString(process.env.NEAR_ACCOUNT_PRIVATE_KEY!);

  await keyStore.setKey("testnet", process.env.NEAR_ACCOUNT_ID!, keyPair);

  const near = await connect({ ...nearConfig, keyStore });
  const account = await near.account(process.env.NEAR_ACCOUNT_ID!);

  return { account, nearConfig };
};
