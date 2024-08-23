import { createNearAccount, MpcContract } from "../../src/";

const TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};
const path = "derivationPath";
describe("mpcContract", () => {
  it("Contract (Read) Methods", async () => {
    const accountId = "farmface.testnet";
    const contractId = "v1.signer-dev.testnet";
    const account = await createNearAccount(accountId, TESTNET_CONFIG);
    const mpc = new MpcContract(account, contractId);
    const ethAddress = await mpc.deriveEthAddress(path);
    expect(mpc.accountId()).toEqual(contractId);
    expect(ethAddress).toEqual("0xde886d5d90cf3ca465bcaf410fe2b460ec79a7d9");

    const signArgs = {
      payload: [1, 2],
      path,
      key_version: 0,
    };
    const expected = {
      signerId: "farmface.testnet",
      receiverId: "v1.signer-dev.testnet",
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "sign",
            args: {
              request: {
                payload: [1, 2],
                path: "derivationPath",
                key_version: 0,
              },
            },
            gas: "250000000000000",
            deposit: "1",
          },
        },
      ],
    };
    const result = await mpc.encodeSignatureRequestTx(signArgs);
    expect(result).toEqual(expected);
    // Set Gas:
    expected.actions[0]!.params.gas = "1";
    expect(await mpc.encodeSignatureRequestTx(signArgs, 1n)).toEqual(expected);
  });
});
