import { createNearAccount, MpcContract } from "../../src/";

const TESTNET_CONFIG = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
};
const path = "derivationPath";
describe("mpcContract", () => {
  it("Contract (Read) Methods", async () => {
    const accountId = "farmface.testnet";
    const contractId = "v1.signer-prod.testnet";
    const account = await createNearAccount(accountId, TESTNET_CONFIG);
    const mpc = new MpcContract(account, contractId);
    const ethAddress = await mpc.deriveEthAddress(path);
    expect(mpc.accountId()).toEqual(contractId);
    expect(ethAddress).toEqual("0xaca49dcd616e2c1dce4e3490b49474af271790b5");

    const signArgs = {
      payload: [1, 2],
      path,
      key_version: 0,
    };
    const expected = {
      signerId: accountId,
      receiverId: contractId,
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
    // The deposit is non-deterministic!
    expected.actions[0]!.params.deposit = result.actions[0]!.params.deposit;
    expect(result).toEqual(expected);
    // Set Gas:
    expected.actions[0]!.params.gas = "1";
    expect(await mpc.encodeSignatureRequestTx(signArgs, 1n)).toEqual(expected);
  });
});
