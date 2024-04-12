import { TransactionWithSignature } from "../src";
import {
  ethersJsAddSignature,
  viemAddSig,
  buildTxPayload,
} from "../src/utils/transaction";

describe("Transaction Builder Functions", () => {
  it("buildTxPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c0";
    const payload = await buildTxPayload(txHash);
    expect(payload).toEqual([
      178, 243, 90, 239, 203, 210, 59, 212, 215, 225, 70, 217, 13, 214, 94, 37,
      36, 9, 101, 199, 230, 132, 140, 98, 211, 7, 68, 130, 233, 88, 145, 179,
    ]);
  });
  it("addSignature", async () => {
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
    const sender = "0xa61d98854f7ab25402e3d12548a2e93a080c1f97";
    // This does not agree with:
    // try ethersJsAddSignature(testTx, sender)!
    // which says that vByte should be "01"!!!
    expect(viemAddSig(testTx, sender)).toEqual(expectedSig("80"));
    expect(ethersJsAddSignature(testTx, sender)).toEqual(expectedSig("01"));
  });
});

function expectedSig(vByte: string): `0x${string}` {
  return `0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c0${vByte}a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8`;
}
