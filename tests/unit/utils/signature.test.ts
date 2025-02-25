import {
  signatureFromOutcome,
  signatureFromTxHash,
  transformSignature,
} from "../../../src/utils/signature";

describe("utility: get Signature", () => {
  const url: string = "https://archival-rpc.testnet.near.org";
  const accountId = "neareth-dev.testnet";
  const successHash = "CYGDarJXUtUug83ur6QsRzr86bDjAxN3wk8N3acGXMgg";
  const relayedSuccessHash = "FWtVVNGLkdAmHwQQCHvZCbNGynEWSJbeKA5GCZy1ghYf";
  const failedHash = "ERdVFTNmuf1uHsiGyTu2n6XDbVfXqZXQ4N9rU6BqRMjk";
  const nonExistantTxHash = "7yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";
  const nonSignatureRequestHash =
    "BCxYwZ6YfscaHza5MEDmk4DRgKZWJ77ZtBS5L9kH3Ve7";

  it("successful: signatureFromTxHash", async () => {
    const sig = await signatureFromTxHash(url, successHash, accountId);
    expect(sig).toEqual({
      r: "0x200209319EBF0858BB8543A9A927BDE6A54E7BD4914B76F96BDF67AEA4211CDD",
      s: "0x412F478B129A7A586B158BA178C7A921978473384130ACF9E4034E16063FF5B5",
      yParity: 0,
    });

    const relayedSig = await signatureFromTxHash(
      url,
      relayedSuccessHash,
      "mintbase.testnet"
    );
    expect(relayedSig).toEqual({
      r: "0xFEA01D93DFF2EAA73F81545902788603E8D930786B809DC9DC62E5680D91DD72",
      s: "0x4A4487EA25EDFEBBEE1FBA556AE4F90E141CAAFA13648CA8C8D144890F8EA1C4",
      yParity: 0,
    });
  });

  it("signatureFromTxHash fails Error", async () => {
    await expect(signatureFromTxHash(url, failedHash)).rejects.toThrow(
      `Signature Request Failed in ${failedHash}`
    );
  });

  it("signatureFromTxHash fails with no signature", async () => {
    await expect(
      signatureFromTxHash(url, nonSignatureRequestHash)
    ).rejects.toThrow(
      `No detectable signature found in transaction ${nonSignatureRequestHash}`
    );
  });

  // This one takes too long.
  it.skip("signatureFromTxHash fails with server error", async () => {
    await expect(signatureFromTxHash(url, nonExistantTxHash)).rejects.toThrow(
      "JSON-RPC error: Server error"
    );
  });

  it("signatureFromTxHash fails with parse error", async () => {
    await expect(signatureFromTxHash(url, "nonsense")).rejects.toThrow(
      "HTTP error! status: 400"
    );
  });

  it("transforms mpcSignature", () => {
    const signature = {
      big_r: {
        affine_point:
          "0337F110D095850FD1D6451B30AF40C15A82566C7FA28997D3EF83C5588FBAF99C",
      },
      s: {
        scalar:
          "4C5D1C3A8CAFF5F0C13E34B4258D114BBEAB99D51AF31648482B7597F3AD5B72",
      },
      recovery_id: 1,
    };
    expect(transformSignature(signature)).toEqual({
      r: "0x37F110D095850FD1D6451B30AF40C15A82566C7FA28997D3EF83C5588FBAF99C",
      s: "0x4C5D1C3A8CAFF5F0C13E34B4258D114BBEAB99D51AF31648482B7597F3AD5B72",
      yParity: 1,
    });
  });

  it("signatureForOutcome", () => {
    // Outcome from: wkBWmTXoUgdm7RvdwNTUmtmDZLB14TfXMdyf57UXAaZ
    const outcome = {
      status: {
        SuccessValue:
          "eyJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMkVBRDJCMUYwN0NDNDk4REIyNTU2MzE0QTZGNzdERkUzRUUzRDE0NTNCNkQ3OTJBNzcwOTE5MjRFNTFENEMyNDcifSwicyI6eyJzY2FsYXIiOiIxQTlGNjBDMkNDMjM5OEE1MDk3N0Q0Q0E5M0M0MDE2OEU4RjJDRTdBOUM5MEUzNzQ1MjJERjNDNzZDRjU0RjJFIn0sInJlY292ZXJ5X2lkIjoxfQ==",
      },
      // irrelevant fields
      receipts_outcome: [],
      transaction: null,
      transaction_outcome: {
        id: "",
        outcome: {
          logs: [],
          receipt_ids: [],
          gas_burnt: 0,
          tokens_burnt: "",
          executor_id: "string",
          status: {},
        },
      },
    };
    expect(signatureFromOutcome(outcome)).toEqual({
      r: "0xEAD2B1F07CC498DB2556314A6F77DFE3EE3D1453B6D792A77091924E51D4C247",
      s: "0x1A9F60C2CC2398A50977D4CA93C40168E8F2CE7A9C90E374522DF3C76CF54F2E",
      yParity: 1,
    });
  });
});
