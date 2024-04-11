import { setupNearEthAdapter } from "../examples/setup";

describe("End To End", () => {
  it("Runs the Send ETH Tx", async () => {
    const evm = await setupNearEthAdapter();
    await evm.signAndSendTransaction({
      to: "0xdeADBeeF0000000000000000000000000b00B1e5",
      // THIS IS ONE WEI!
      value: 1n,
    });
  });
});
