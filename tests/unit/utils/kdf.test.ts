import {
  najPublicKeyStrToUncompressedHexPoint,
  deriveChildPublicKey,
  uncompressedHexPointToEvmAddress,
} from "../../../src/utils/kdf";

const ROOT_PK =
  "secp256k1:54hU5wcCmVUPFWLDALXMh1fFToZsVXrx9BbTbHzSfQq1Kd1rJZi52iPa4QQxo6s5TgjWqgpY8HamYuUDzG6fAaUq";
const DECOMPRESSED_HEX =
  "04cb41bab8bc97121f4902514ca57a284f167b9239ecb8176831d1ef0fede87c61ca3e59da1c194aa90108098a9e5cdc55d3b3297cdefbc085ffafd0f2c34ae61a";
const CHILD_PK =
  "0430dbf32f29a5e9d8df4173d940932be30baf28bae98bf93476eba7d5e2c3d838e807f6b7442e7796e2ea1550a6c1f6de1367a7cdb6f0e68a1e36fafd35eb6ea0";
const CHILD_PK_NO_PATH =
  "0470649ea5975a2bdb5895c78d8da22e0fb8ddc5099fde4d8c826107bd9a705ad3d61644d844704dfd6467a46e6e2b19e61568c7909c4966f0577286b72447f420";

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
      "0x759e10411dda5138e331b7ad5ce1b937550db737"
    );
  });

  it("converts uncompressed hex point to EVM address", () => {
    const result = uncompressedHexPointToEvmAddress(CHILD_PK);
    expect(result).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result).toMatch("0x759e10411dda5138e331b7ad5ce1b937550db737");
  });
});
