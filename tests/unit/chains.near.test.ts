import { KeyPair } from "near-api-js";
import {
  nearAccountFromAccountId,
  nearAccountFromKeyPair,
  createNearAccount,
} from "../../src/";

const TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};
describe("near", () => {
  it("createNearAccount", async () => {
    const id = "farmface.testnet";
    const account = await createNearAccount(id, TESTNET_CONFIG);
    expect(account.accountId).toBe(id);
  });

  it("nearAccountFromAccountId", async () => {
    const id = "farmface.testnet";
    const account = await nearAccountFromAccountId(id, TESTNET_CONFIG);
    expect(account.accountId).toBe(id);
  });

  it("nearAccountFromKeyPair", async () => {
    const id = "farmface.testnet";
    const account = await nearAccountFromKeyPair({
      accountId: id,
      network: TESTNET_CONFIG,
      keyPair: KeyPair.fromRandom("ed25519"),
    });
    expect(account.accountId).toBe(id);
  });
});
