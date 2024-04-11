import { setupNearEthAdapter } from "../examples/setup";
import { NearEthAdapter } from "../src";

const ONE_ADDRESS = "0x1111111111111111111111111111111111111111";

describe.skip("Near Eth Adapter", () => {
  let adapter: NearEthAdapter;

  beforeAll(async () => {
    adapter = await setupNearEthAdapter();
  });
  it("createTxPayload", async () => {
    const { signArgs } = await adapter.createTxPayload(
      {
        to: ONE_ADDRESS,
        value: 1n,
        data: "0x",
      },
      1
    );
    console.log(signArgs.payload);
    expect(signArgs).toEqual({
      payload: [
        205, 122, 162, 139, 210, 184, 225, 242, 45, 225, 52, 204, 240, 116, 140,
        27, 73, 166, 251, 122, 197, 60, 24, 147, 125, 132, 132, 195, 131, 39,
        57, 189,
      ],
    });
  });
});
