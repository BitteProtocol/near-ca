import { signatureFromTxHash } from "../../src/utils/signature";

describe("utility: get Signature", () => {
  const url: string = "https://archival-rpc.testnet.near.org";
  // const accountId = "neareth-dev.testnet";
  const successHash = "GeqmwWmWxddzh2yCEhugbJkhzsJMhCuFyQZa61w5dk7N";
  const failedHash = "6yRm5FjHn9raRYPoHH6wimizhT53PnPnuvkpecyQDqLY";

  it("successful: signatureFromTxHash", async () => {
    const sig = await signatureFromTxHash(url, successHash);
    expect(sig).toEqual({
      big_r: {
        affine_point:
          "023BA6A8CE1369484EF384084EC1089581D815260FC274FEF780478C7969F3CFFC",
      },
      s: {
        scalar:
          "5194CCE1D9F239C28C7765453873A07F35850A485DFE285551FB62C899B61170",
      },
      recovery_id: 1,
    });
  });

  // Still need a NEW example of this!
  // it("successful: alternative signatureFromTxHash", async () => {
  //   const sig = await signatureFromTxHash(
  //     url,
  //     "EK4XUwyR29w6eaSfSSPb8he3y7nkTQSbYJVXgSx5vZ4T"
  //   );
  //   expect(sig).toEqual({
  //     big_r:
  //       "024598E193A9377B98A5B4621BA81FDEEA9DED3E3E7F41C073D0537BC2769C10FC",
  //     big_s: "65D23B4EA333FFC5486FA295B7AEAB02EACA4E35E22B55108563A63199B96558",
  //   });
  // });

  it("failed: signatureFromTxHash", async () => {
    await expect(signatureFromTxHash(url, failedHash)).rejects.toThrow(
      `No valid values found in transaction receipt ${failedHash}}`
    );
  });
});
