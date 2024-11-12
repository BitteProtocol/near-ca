import { TransactionSerializable } from "viem";
import {
  isEIP712TypedData,
  isRlpHex,
  isSignMethod,
  isTransactionSerializable,
} from "../../src/";

const validEIP1559Transaction: TransactionSerializable = {
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: BigInt(1000000000000000000), // 1 ETH
  chainId: 1,
  maxFeePerGas: 1n,
};

const commonInvalidCases = [
  null,
  undefined,
  {},
  { to: "invalid-address" },
  { value: "not-a-bigint" },
  { chainId: "not-a-number" },
  "random string",
  123,
  [],
];

describe("SignMethod", () => {
  it("returns true for all valid SignMethods", async () => {
    [
      "eth_sign",
      "personal_sign",
      "eth_sendTransaction",
      "eth_signTypedData",
      "eth_signTypedData_v4",
    ].map((item) => expect(isSignMethod(item)).toBe(true));
  });

  it("returns false for invalid data inputs", async () => {
    ["poop", undefined, false, 1, {}].map((item) =>
      expect(isSignMethod(item)).toBe(false)
    );
  });
});
describe("isEIP712TypedData", () => {
  it("returns true for valid EIP712TypedData", async () => {
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

  it("returns false for invalid data inputs", async () => {
    commonInvalidCases.map((item) =>
      expect(isEIP712TypedData(item)).toBe(false)
    );
  });
});

describe("isTransactionSerializable", () => {
  it("should return true for valid transaction data", () => {
    expect(isTransactionSerializable(validEIP1559Transaction)).toBe(true);
  });

  it("should return false for invalid transaction data", () => {
    commonInvalidCases.forEach((testCase) => {
      expect(isTransactionSerializable(testCase)).toBe(false);
    });
  });
});

describe("isRlpHex", () => {
  it("should return true for valid RLP-encoded transaction hex", () => {
    // This is an example of a valid RLP-encoded transaction hex:

    // serializeTransaction(validEIP1559Transaction)
    const validRlpHex =
      "0x02e501808001809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0";
    expect(isRlpHex(validRlpHex)).toBe(true);
  });

  it("should return false for invalid RLP hex data", () => {
    const invalidCases = [
      null,
      undefined,
      {},
      "not-a-hex",
      "0x", // empty hex
      "0x1234", // too short
      "0xinvalid",
      123,
      [],
      // Invalid RLP structure but valid hex
      "0x1234567890abcdef",
    ];

    invalidCases.forEach((testCase) => {
      expect(isRlpHex(testCase)).toBe(false);
    });
  });
});
