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

    expect(() =>
      adapter.beta.handleSessionRequest({
        params: {
          chainId: "11155111",
          request: { method: "poop", params: [] },
        },
      })
    ).rejects.toThrow(
      `Unsupported sign method poop: Available sign methods ${signMethods}`
    );

    const ethSign = await adapter.beta.handleSessionRequest({
      params: {
        chainId: "11155111",
        request: {
          method: "eth_sign",
          params: [adapter.address, "0x"],
        },
      },
    });

    expect(ethSign).toStrictEqual({
      nearPayload: {
        signerId: "farmface.testnet",
        receiverId: mpcContractId,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "sign",
              args: {
                request: {
                  path: "ethereum,1",
                  payload: [
                    95, 53, 220, 233, 139, 164, 251, 162, 85, 48, 160, 38, 237,
                    128, 178, 206, 205, 170, 49, 9, 27, 164, 149, 139, 153, 181,
                    46, 161, 208, 104, 173, 173,
                  ],
                  key_version: 0,
                },
              },
              gas: "250000000000000",
              // This isn't deterministic.
              deposit: ethSign.nearPayload.actions[0]?.params.deposit,
            },
          },
        ],
      },
      evmMessage: "",
      hashToSign:
        "0x5f35dce98ba4fba25530a026ed80b2cecdaa31091ba4958b99b52ea1d068adad",
    });
  });
});
