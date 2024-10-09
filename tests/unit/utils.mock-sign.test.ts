import { mockAdapter } from "../../src/utils/mock-sign";

describe("Mock Signing", () => {
  it("MockAdapter", async () => {
    const adapter = await mockAdapter("bh2smith.testnet");
    expect(adapter.address).toBe("0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1");
    const signature = await adapter.signMessage("Hello Joe!");
    expect(signature).toBe(
      "0xcadb9d3ade67e815c11646eea6cd52abb7f860af612cd914a2c64c01908af870246926e8d5774d0b63efc46cd9f77cc650a7ad923df69a5151805422ab1d625a1c"
    );
  });
});
