import {
  najPublicKeyStrToUncompressedHexPoint,
  deriveChildPublicKey,
  uncompressedHexPointToEvmAddress,
} from "../../src/utils/kdf";

const ROOT_PK =
  "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3";
const DECOMPRESSED_HEX =
  "04a8bb8176747682aab5c681d4ef375ca537023b2b287d8b5f9d89505277a5a291538ef3680882d8fb793a62a5fdb4c6974c7cd8f9eb0b9cbbf659314c30347000";
const CHILD_PK =
  "045cf2e51558f53abbfb96dbf13a205ee435c754fbee242119181a9589501c594c2639147a735c426d9b2bd92dfcc38e16abbc03c65a21352707f8d0b0686bb387";
const CHILD_PK_NO_PATH =
  "048129eaf4ae40314954e14df39c9b8504c6cd754c7bd73d5699c16f683fcc71f81e43046a8f5aae794cbd0842594d4ec14fa7b0c0c0f0d942f19a62b01ec52f4e";

describe("Crypto Functions", () => {
  it("converts NEAR public key string to uncompressed hex point", () => {
    const result = najPublicKeyStrToUncompressedHexPoint(ROOT_PK);
    expect(result).toMatch(/^04[0-9a-f]+$/);
    expect(result).toEqual(DECOMPRESSED_HEX);
  });

  it("derives child public key", async () => {
    const parentHex = DECOMPRESSED_HEX;
    const signerId = "neareth-dev.testnet";
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

  it("new address from near", async () => {
    const parentHex = DECOMPRESSED_HEX;
    const signerId = "neareth-dev.testnet";
    const path = "ethereum,1";
    const publicKey = await deriveChildPublicKey(parentHex, signerId, path);
    expect(uncompressedHexPointToEvmAddress(publicKey)).toEqual(
      "0x759E10411Dda5138E331B7Ad5cE1B937550db737"
    );
  });

  it("converts uncompressed hex point to EVM address", () => {
    const result = uncompressedHexPointToEvmAddress(CHILD_PK);
    expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result).toMatch("0x0c4d930335f3bcbb8720d6702f3f3c7b0ec29478");
  });
});
