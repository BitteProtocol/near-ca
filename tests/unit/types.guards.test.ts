import { isEIP712TypedData, isSignMethod } from "../../src/";
describe("Type Guards", () => {
  it("isSignMethod", async () => {
    expect(isSignMethod("poop")).toBe(false);
    [
      "eth_sign",
      "personal_sign",
      "eth_sendTransaction",
      "eth_signTypedData",
      "eth_signTypedData_v4",
    ].map((item) => expect(isSignMethod(item)).toBe(true));
  });

  it("isEIP712TypedData", async () => {
    const message = {
      from: {
        name: "Cow",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      contents: "Hello, Bob!",
    } as const;

    const domain = {
      name: "Ether Mail",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    } as const;

    const types = {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    } as const;

    const typedData = {
      types,
      primaryType: "Mail",
      message,
      domain,
    } as const;
    expect(isEIP712TypedData(typedData)).toBe(true);
  });
});
