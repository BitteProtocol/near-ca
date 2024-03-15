import { TypedDataEncoder } from "ethers";

const types = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

function hexStringToUint8Array(hex: string): Uint8Array {
  // Ensure the hex string has an even number of characters
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string has an odd number of characters");
  }

  // Remove the "0x" prefix if present
  if (hex.startsWith("0x")) {
    hex = hex.slice(2);
  }

  // Convert each pair of characters (byte) to a number and store in an array
  const byteArray = new Uint8Array(hex.length / 2);
  for (let i = 0; i < byteArray.length; i++) {
    const start = i * 2;
    const byteValue = parseInt(hex.substring(start, start + 2), 16);
    if (isNaN(byteValue)) {
      throw new Error("Hex string contains invalid characters");
    }
    byteArray[i] = byteValue;
  }

  return byteArray;
}

export async function permitPayload(): Promise<void> {
  // Encode the data for signing
  // Define the EIP-712 domain and types
  const domain = {
    name: "<Name of the token>",
    version: "<Token version>",
    chainId: 11155111,
    verifyingContract: "<Token Contract Address>",
  };

  const value = {
    // owner here should be the derived address.
    owner: "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd",
    spender: "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
    value:
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    nonce: "0",
    deadline: "1868180505",
  };

  const hashedMessage = TypedDataEncoder.hash(domain, types, value);
  Array.from(
    new Uint8Array(hexStringToUint8Array(hashedMessage).slice().reverse())
  );
}
