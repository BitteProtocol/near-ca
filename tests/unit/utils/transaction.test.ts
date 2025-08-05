import { zeroAddress } from "viem";
import { Network, TransactionWithSignature } from "../../../src";
import {
  buildTxPayload,
  addSignature,
  toPayload,
  populateTx,
  fromPayload,
} from "../../../src/utils/transaction";

describe("Transaction Builder Functions", () => {
  it("buildTxPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c0";
    const payload = buildTxPayload(txHash);
    expect(payload).toEqual([
      179, 145, 88, 233, 130, 68, 7, 211, 98, 140, 132, 230, 199, 101, 9, 36,
      37, 94, 214, 13, 217, 70, 225, 215, 212, 59, 210, 203, 239, 90, 243, 178,
    ]);
  });

  it("pass: toPayload", async () => {
    const txHash =
      "0x52b6437db56d87f5991d7c173cf11b9dd0f9fb083260bef1bf0c338042bc398c";
    expect(toPayload(txHash)).toStrictEqual([
      82, 182, 67, 125, 181, 109, 135, 245, 153, 29, 124, 23, 60, 241, 27, 157,
      208, 249, 251, 8, 50, 96, 190, 241, 191, 12, 51, 128, 66, 188, 57, 140,
    ]);
  });

  it("fails: toPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c00";
    expect(() => toPayload(txHash)).toThrow(
      `Payload must have 32 bytes: ${txHash}`
    );
  });

  it("pass: fromPayload", async () => {
    const txHash =
      "0x52b6437db56d87f5991d7c173cf11b9dd0f9fb083260bef1bf0c338042bc398c";
    expect(fromPayload(toPayload(txHash))).toBe(txHash);
  });
  it("addSignature", async () => {
    const testTx: TransactionWithSignature = {
      transaction:
        "0x02e883aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c0",
      signature: {
        r: "0xEF532579E267C932B959A1ADB9E455AC3C5397D0473471C4C3DD5D62FD4D7EDE",
        s: "0x7C195E658C713D601D245311A259115BB91EC87C86ACB07C03BD9C1936A6A9E8",
        yParity: 1,
      },
    };
    expect(addSignature(testTx)).toEqual(
      "0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c001a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8"
    );
  });

  it("populateTx", async () => {
    const baseTx = {
      chainId: 11155111,
      to: zeroAddress,
    };
    await expect(
      populateTx(baseTx, zeroAddress, Network.fromChainId(100).client)
    ).rejects.toThrow("client chainId=100 mismatch with tx.chainId=11155111");

    const tx = await populateTx(baseTx, zeroAddress);
    expect(tx.to).toEqual(zeroAddress);
    expect(tx.value).toEqual(0n);
  });
});
