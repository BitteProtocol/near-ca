import { signatureFromTxHash } from "../src/utils/getSignature";

describe("utility: get Signature", () => {
  it("signatureFromTxHash", async () => {
    const hash = "88LS5pkj99pd6B6noZU6sagQ1QDwHHoSy3qpHr5xLNsR";
    const sig = await signatureFromTxHash(hash, "neareth-dev.testnet");
    console.log(sig);
  });
});
