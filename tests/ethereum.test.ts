import { setupNearEthAdapter } from "../examples/setup";

const ONE_ADDRESS = "0x1111111111111111111111111111111111111111";

describe("Near Eth Adapter", () => {
  it.skip("Create Tx Payload", async () => {
    const evm = await setupNearEthAdapter();

    const { signArgs } = await evm.createTxPayload(
      {
        to: ONE_ADDRESS,
        value: 1n,
        data: "0x",
      },
      1
    );
    expect(signArgs.payload).toEqual([
      110, 28, 45, 165, 219, 192, 26, 112, 63, 28, 205, 2, 103, 60, 51, 230,
      196, 252, 2, 98, 253, 73, 252, 4, 16, 81, 69, 33, 208, 188, 153, 216,
    ]);
    // const { big_r, big_s } = await evm.mpcContract.requestSignature(signArgs);
    // const s = evm.reconstructSignature({
    //   transaction,
    //   signature: { big_r, big_s },
    // });
  });
});
