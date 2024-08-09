import {
  signatureFromOutcome,
  signatureFromTxHash,
  transformSignature,
} from "../../src/utils/signature";

describe("utility: get Signature", () => {
  const url: string = "https://archival-rpc.testnet.near.org";
  // const accountId = "neareth-dev.testnet";
  const successHash = "GeqmwWmWxddzh2yCEhugbJkhzsJMhCuFyQZa61w5dk7N";
  const relayedSuccessHash = "G1f1HVUxDBWXAEimgNWobQ9yCx1EgA2tzYHJBFUfo3dj";
  const failedHash = "6yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";
  const nonExistantTxHash = "7yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";
  const nonSignatureRequestHash =
    "4pNDN238dgEjj5eNaAF4qzoztF4TmrN82hwJs2zTwuqe";

  it("successful: signatureFromTxHash", async () => {
    const sig = await signatureFromTxHash(url, successHash);
    expect(sig).toEqual({
      r: "0x3BA6A8CE1369484EF384084EC1089581D815260FC274FEF780478C7969F3CFFC",
      s: "0x5194CCE1D9F239C28C7765453873A07F35850A485DFE285551FB62C899B61170",
      yParity: 1,
    });

    const relayedSig = await signatureFromTxHash(url, relayedSuccessHash);
    expect(relayedSig).toEqual({
      r: "0x593873A56AB98F91C60C23DCA370835CA05254A0305F2753A1CFC3CEB4C46F86",
      s: "0x783D9887FB4AA9B07E672D7FA88587FB45E7FDC066F7ECA0774E6FE36806404F",
      yParity: 1,
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
      "JSON-RPC error: Parse error"
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
