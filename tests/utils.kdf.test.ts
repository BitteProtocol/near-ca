import { TransactionWithSignature } from "../src";
import {
  najPublicKeyStrToUncompressedHexPoint,
  deriveChildPublicKey,
  uncompressedHexPointToEvmAddress,
} from "../src/utils/kdf";
import {
  addSignature,
  buildTxPayload,
  ethersJsAddSignature,
} from "../src/utils/transaction";

const ROOT_PK =
  "ecp256k1:4HFcTSodRLVCGNVcGc4Mf2fwBBBxv9jxkGdiW2S2CA1y6UpVVRWKj6RX7d7TDt65k2Bj3w9FU4BGtt43ZvuhCnNt";
const DECOMPRESSED_HEX =
  "04a410e78ef8a4f81ffc7e1f2e60c6fd6ccd5ed1689ea83b980215a58ded51871d16b2c99f3772e6b017b35a2367883552ea6b545f82552e3b05bae56975d40241";
const CHILD_PK =
  "04445b302250c5ba69e6a45d39b73a4cefc99a7e6e75ac164080c8bc68aa8c16fc332cf9b485f0f8ed0d815affdf3f9ad7e450c2658351fb09de2ad54e0f60795d";

describe("Crypto Functions", () => {
  it("converts NEAR public key string to uncompressed hex point", () => {
    const result = najPublicKeyStrToUncompressedHexPoint(ROOT_PK);
    expect(result).toMatch(/^04[0-9a-f]+$/);
    expect(result).toEqual(DECOMPRESSED_HEX);
  });

  it("derives child public key", async () => {
    const parentHex = DECOMPRESSED_HEX;
    const signerId = "ethdenver2024.testnet";
    const path = "ethereum,1";
    const result = await deriveChildPublicKey(parentHex, signerId, path);
    expect(result).toMatch(/^04[0-9a-f]+$/);
    expect(result).toEqual(CHILD_PK);
  });

  it("converts uncompressed hex point to EVM address", () => {
    const uncompressedHex = CHILD_PK;
    const result = uncompressedHexPointToEvmAddress(uncompressedHex);
    expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result).toMatch("0x8958e9780a209b57aa639330196f2baba27d760b");
  });

  it.only("addSignature", async () => {
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
    const signature = await addSignature(testTx, sender);
    console.log(ethersJsAddSignature(testTx, sender));
    expect(signature).toEqual(
      "0x02f86b83aa36a780845974e6f084d0aa7af08094deadbeef0000000000000000000000000b00b1e50180c001a0ef532579e267c932b959a1adb9e455ac3c5397d0473471c4c3dd5d62fd4d7edea07c195e658c713d601d245311a259115bb91ec87c86acb07c03bd9c1936a6a9e8"
    );
  });
  it("buildTxPayload", async () => {
    const txHash =
      "0x02e783aa36a7808309e8bb84773f7cbb8094deadbeef0000000000000000000000000b00b1e50180c0";
    const payload = await buildTxPayload(txHash);
    expect(payload).toEqual([
      178, 243, 90, 239, 203, 210, 59, 212, 215, 225, 70, 217, 13, 214, 94, 37,
      36, 9, 101, 199, 230, 132, 140, 98, 211, 7, 68, 130, 233, 88, 145, 179,
    ]);
  });
});
