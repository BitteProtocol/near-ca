import { isTestnet } from "../../src/";
describe("network", () => {
  it("isTestnet", async () => {
    expect(isTestnet(1)).toBe(false);
    expect(isTestnet(10)).toBe(false);
    expect(isTestnet(97)).toBe(true);
    expect(isTestnet(43114)).toBe(false);
    expect(isTestnet(100)).toBe(false);
    expect(isTestnet(137)).toBe(false);
    expect(isTestnet(10200)).toBe(true);
    expect(isTestnet(84532)).toBe(true);
    expect(isTestnet(421614)).toBe(true);
    expect(isTestnet(11155111)).toBe(true);
  });
});
