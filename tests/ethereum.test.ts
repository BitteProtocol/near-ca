import { setupNearEthAdapter } from "../examples/setup";
import { NearEthAdapter, TransactionWithSignature } from "../src";

const ONE_ADDRESS = "0x1111111111111111111111111111111111111111";

describe("Near Eth Adapter", () => {
  let adapter: NearEthAdapter;

  beforeAll(async () => {
    adapter = await setupNearEthAdapter();
  });
  it.skip("Create Tx Payload", async () => {
    const { signArgs } = await adapter.createTxPayload(
      {
        to: ONE_ADDRESS,
        value: 1n,
        data: "0x",
      },
      1
    );
    console.log(signArgs.payload);
    expect(signArgs.payload).toEqual([
      205, 122, 162, 139, 210, 184, 225, 242, 45, 225, 52, 204, 240, 116, 140,
      27, 73, 166, 251, 122, 197, 60, 24, 147, 125, 132, 132, 195, 131, 39, 57,
      189,
    ]);
    // const { big_r, big_s } = await evm.mpcContract.requestSignature(signArgs);
    // const s = evm.reconstructSignature({
    //   transaction,
    //   signature: { big_r, big_s },
    // });
  });

  it.skip("Reconstructs Signature", async () => {
    const testTx: TransactionWithSignature = {
      transaction:
        "0x02e883aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c0",
      signature: {
        big_r:
          "02EF532579E267C932B959A1ADB9E455AC3C5397D0473471C4C3DD5D62FD4D7EDE",
        big_s:
          "7C195E658C713D601D245311A259115BB91EC87C86ACB07C03BD9C1936A6A9E8",
      },
    };
    // This shit should not be async. Reason: VEIM.
    const signedTx = await adapter.reconstructSignature(testTx);
    console.log(signedTx);
    // expect(serializeTransaction(signedTx)).toEqual(
    //   "0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c001a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8"
    // );
  });
});
