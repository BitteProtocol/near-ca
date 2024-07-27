import { TransactionWithSignature } from "../../src";
import {
  buildTxPayload,
  addSignature,
  toPayload,
} from "../../src/utils/transaction";

describe("Transaction Builder Functions", () => {
  it("buildTxPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c0";
    const payload = buildTxPayload(txHash);
    expect(payload).toEqual([
      178, 243, 90, 239, 203, 210, 59, 212, 215, 225, 70, 217, 13, 214, 94, 37,
      36, 9, 101, 199, 230, 132, 140, 98, 211, 7, 68, 130, 233, 88, 145, 179,
    ]);
  });

  it("fails: toPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c00";
    expect(() => toPayload(txHash)).toThrow(
      `Payload Hex must have 32 bytes: ${txHash}`
    );
  });

  it.only("addSignature", async () => {
    const testTx: TransactionWithSignature = {
      transaction:
        "0x02e883aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c0",
      signature: {
        r: "0xEF532579E267C932B959A1ADB9E455AC3C5397D0473471C4C3DD5D62FD4D7EDE",
        s: "0x7C195E658C713D601D245311A259115BB91EC87C86ACB07C03BD9C1936A6A9E8",
        yParity: 1,
      },
    };
    const t = "0x02eb83aa36a7808403bab19885077103441082520894102543f7e6b5786a444cc89ff73012825d13000d0180c0"
    const x = {
      r: '0xE71E2966EF16E5EA36A31E0EB4A367D0DA3F42E8570A615BAEDF509B12F2CA6E' as `0x${string}`,
      s: '0x79F757FF827506F1D6FD5C433FE0F58A12102560184243C902272BC3AFE5E906' as `0x${string}`,
      yParity: 1
    };
    expect(addSignature({ transaction: t, signature: x }, "0x102543f7e6b5786a444cc89ff73012825d13000d")).toEqual(
      "0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c001a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8"
    );
    expect(addSignature(testTx, "0x102543f7e6b5786a444cc89ff73012825d13000d")).toEqual(
      "0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c001a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8"
    );
  });
});
