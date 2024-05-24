import {
  signatureFromTxHash,
  pickValidSignature,
} from "../../src/utils/signature";

describe("utility: get Signature", () => {
  const url: string = "https://archival-rpc.testnet.near.org";
  // const accountId = "neareth-dev.testnet";
  const successHash = "88LS5pkj99pd6B6noZU6sagQ1QDwHHoSy3qpHr5xLNsR";
  const failedHash = "HaG9L4HnP69v6wSnAmKfzsCUhDaVMRZWNGhGqnepsMTD";

  it("successful: signatureFromTxHash", async () => {
    const sig = await signatureFromTxHash(url, successHash);
    expect(sig).toEqual({
      big_r:
        "03EA06CECA2B7D71F6F4DA729A681B4DE44C6402F5F5BB9FC88C6706959D4FEDD4",
      big_s: "67986E234DEC5D51CF6AED452FE1C4544924218AC20B009F81BAAE53C02AFE76",
    });
  });
  it("failed: signatureFromTxHash", async () => {
    await expect(signatureFromTxHash(url, failedHash)).rejects.toThrow(
      "No valid values found in the array."
    );
  });
});

describe("utility: pickValidSignature", () => {
  const sig0 = "0x88LS5pkj99pd6B6noZU6sagQ1QDwHHoSy3qpHr5xLNsR";
  const sig1 = "0xHaG9L4HnP69v6wSnAmKfzsCUhDaVMRZWNGhGqnepsMTD";

  it("No signature is valid, should throw error", async () => {
    expect(() => pickValidSignature([false, false], [sig0, sig1]))
      .toThrow("Invalid signature");
  });

  it("both sig0 and sig1 are valid, should return sig0", async () => {
    const sig = pickValidSignature([true, true], [sig0, sig1]);
    expect(sig).toEqual(sig0);
  });

  it("sig0 is valid, should return sig0", async () => {
    const sig = pickValidSignature([true, false], [sig0, sig1]);
    expect(sig).toEqual(sig0);
  });

  it("sig1 is valid, should return sig1", async () => {
    const sig = pickValidSignature([false, true], [sig0, sig1]);
    expect(sig).toEqual(sig1);
  });
});
