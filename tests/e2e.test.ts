import { setupNearEthAdapter } from "../examples/setup";
import { NearEthAdapter } from "../src";
import { getBalance } from "viem/actions";

describe("End To End", () => {
  let evm: NearEthAdapter;
  const to = "0xdeADBeeF0000000000000000000000000b00B1e5";
  const ONE_WEI = 1n;

  beforeAll(async () => {
    evm = await setupNearEthAdapter();
  });

  afterAll(async () => {
    clearTimeout();
  });

  it("signAndSendTransaction", async () => {
    await expect(
      evm.signAndSendTransaction({ to, value: ONE_WEI })
    ).resolves.not.toThrow();
  });

  it("Fails to sign and send", async () => {
    const senderBalance = await getBalance(evm.ethClient, {
      address: evm.ethPublicKey(),
    });
    await expect(
      evm.signAndSendTransaction({ to, value: senderBalance + ONE_WEI })
    ).rejects.toThrow();
  });

  it("signMessage", async () => {
    await expect(evm.signMessage("NearEth")).resolves.not.toThrow();
  });
});
