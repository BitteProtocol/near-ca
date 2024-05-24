import {
  najPublicKeyStrToUncompressedHexPoint,
  deriveChildPublicKey,
  uncompressedHexPointToEvmAddress,
} from "../../src/utils/kdf";

const ROOT_PK =
  "ecp256k1:4HFcTSodRLVCGNVcGc4Mf2fwBBBxv9jxkGdiW2S2CA1y6UpVVRWKj6RX7d7TDt65k2Bj3w9FU4BGtt43ZvuhCnNt";
const DECOMPRESSED_HEX =
  "04a410e78ef8a4f81ffc7e1f2e60c6fd6ccd5ed1689ea83b980215a58ded51871d16b2c99f3772e6b017b35a2367883552ea6b545f82552e3b05bae56975d40241";
const CHILD_PK =
  "04445b302250c5ba69e6a45d39b73a4cefc99a7e6e75ac164080c8bc68aa8c16fc332cf9b485f0f8ed0d815affdf3f9ad7e450c2658351fb09de2ad54e0f60795d";
const CHILD_PK_NO_PATH =
  "043e6054b729c98e7b5fd46d4c182e7e243c1b035290cf3e5db1cb0e032382dd5065675c05934a1f7cfdf524aa8af2ede5251f03ba7ea5f154cdbadd65d0e9c36a";

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

  it("derives child public key without path", async () => {
    const parentHex = DECOMPRESSED_HEX;
    const signerId = "ethdenver2024.testnet";
    const result = await deriveChildPublicKey(parentHex, signerId);
    expect(result).toMatch(/^04[0-9a-f]+$/);
    expect(result).toEqual(CHILD_PK_NO_PATH);
  });

  it("converts uncompressed hex point to EVM address", () => {
    const uncompressedHex = CHILD_PK;
    const result = uncompressedHexPointToEvmAddress(uncompressedHex);
    expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result).toMatch("0x8958e9780a209b57aa639330196f2baba27d760b");
  });
});
