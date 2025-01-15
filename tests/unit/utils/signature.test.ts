import {
  signaturesFromOutcome,
  signaturesFromTxHash,
  transformSignature,
} from "../../../src/utils/signature";

describe("utility: get Signature", () => {
  const url: string = "https://archival-rpc.testnet.near.org";
  // const accountId = "neareth-dev.testnet";
  const successHash = "GeqmwWmWxddzh2yCEhugbJkhzsJMhCuFyQZa61w5dk7N";
  const relayedSuccessHash = "G1f1HVUxDBWXAEimgNWobQ9yCx1EgA2tzYHJBFUfo3dj";
  const failedHash = "6yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";
  const nonExistantTxHash = "7yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";
  const nonSignatureRequestHash =
    "4pNDN238dgEjj5eNaAF4qzoztF4TmrN82hwJs2zTwuqe";

  it("successful: signaturesFromTxHash", async () => {
    const sig = await signaturesFromTxHash(url, successHash);
    expect(sig).toEqual([
      {
        r: "0x3BA6A8CE1369484EF384084EC1089581D815260FC274FEF780478C7969F3CFFC",
        s: "0x5194CCE1D9F239C28C7765453873A07F35850A485DFE285551FB62C899B61170",
        yParity: 1,
      },
    ]);

    const relayedSig = await signaturesFromTxHash(url, relayedSuccessHash);
    expect(relayedSig).toEqual([
      {
        r: "0x593873A56AB98F91C60C23DCA370835CA05254A0305F2753A1CFC3CEB4C46F86",
        s: "0x783D9887FB4AA9B07E672D7FA88587FB45E7FDC066F7ECA0774E6FE36806404F",
        yParity: 1,
      },
    ]);
  });

  it("multiSignature Recovery", async () => {
    const sig = await signaturesFromTxHash(
      url,
      "HSka9Ric4UQKAjYUNWHQqu7FFtRa1FJEvtBdDYVPdete"
    );
    expect(sig).toEqual([
      {
        r: "0xCD2D563700B9885AF856ABBFEC5D31362086B03687D8F68CC3A93E8E18F2B7D2",
        s: "0x786197B86A2BC0F0B97439106DF0205487916FCD7CB79C274FEB9A367ED706DA",
        yParity: 1,
      },
      {
        r: "0x037423F8F2328E748CD6A7F61F722D6610B31E907ECC62AD5C5693C39B6FFAC2",
        s: "0x2A16EB63E9D6EC0659087FBEE8239B0187C26BB7F472F7585933E8C3F219B5B6",
        yParity: 0,
      },
    ]);
  });

  it("signaturesFromTxHash fails Error", async () => {
    await expect(signaturesFromTxHash(url, failedHash)).rejects.toThrow(
      `Signature Request Failed in ${failedHash}`
    );
  });

  it("signatureFromTxHash fails with no signature", async () => {
    await expect(
      signaturesFromTxHash(url, nonSignatureRequestHash)
    ).rejects.toThrow(
      `No signature detected in transaction ${nonSignatureRequestHash}`
    );
  });

  // This one takes too long.
  it.skip("signatureFromTxHash fails with server error", async () => {
    await expect(signaturesFromTxHash(url, nonExistantTxHash)).rejects.toThrow(
      "HTTP error! status: 408"
    );
  }, 20000);

  it("signatureFromTxHash fails with parse error", async () => {
    await expect(signaturesFromTxHash(url, "nonsense")).rejects.toThrow(
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
    const dummyOutcomeData = {
      logs: [],
      receipt_ids: [],
      gas_burnt: 0,
      tokens_burnt: "",
      executor_id: "string",
      status: {},
    };

    const outcome = {
      receipts_outcome: [
        {
          id: "",
          outcome: {
            ...dummyOutcomeData,
            status: {
              SuccessValue:
                "eyJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMkVBRDJCMUYwN0NDNDk4REIyNTU2MzE0QTZGNzdERkUzRUUzRDE0NTNCNkQ3OTJBNzcwOTE5MjRFNTFENEMyNDcifSwicyI6eyJzY2FsYXIiOiIxQTlGNjBDMkNDMjM5OEE1MDk3N0Q0Q0E5M0M0MDE2OEU4RjJDRTdBOUM5MEUzNzQ1MjJERjNDNzZDRjU0RjJFIn0sInJlY292ZXJ5X2lkIjoxfQ==",
            },
          },
        },
      ],
      // irrelevant fields
      status: {},
      transaction: null,
      transaction_outcome: {
        id: "",
        outcome: dummyOutcomeData,
      },
    };
    expect(signaturesFromOutcome(outcome)).toEqual([
      {
        r: "0xEAD2B1F07CC498DB2556314A6F77DFE3EE3D1453B6D792A77091924E51D4C247",
        s: "0x1A9F60C2CC2398A50977D4CA93C40168E8F2CE7A9C90E374522DF3C76CF54F2E",
        yParity: 1,
      },
    ]);
  });
});
