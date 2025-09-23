import { zeroAddress } from "viem";
import { setupAdapter, signMethods } from "../../src/";

const accountId = "farmface.testnet";
const network = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};
const mpcContractId = "v1.signer-prod.testnet";
// disable logging on this file.
console.log = () => null;
describe("ethereum", () => {
  it("adapter (read) methods", async () => {
    const adapter = await setupAdapter({
      accountId,
      network,
      mpcContractId,
      derivationPath: "ethereum,1",
    });
    expect(await adapter.address).toBe(
      "0xe09907d0a59bf84a68f5249ab328fc0ce0417a28"
    );
    expect(await adapter.getBalance(100)).toBe(0n);
    expect(adapter.nearAccountId()).toBe(accountId);
    const { transaction } = await adapter.createTxPayload({
      to: zeroAddress,
      chainId: 11155111,
    });

    const request = await adapter.mpcSignRequest(transaction);
    expect(request.actions.length).toEqual(1);
  });
});
