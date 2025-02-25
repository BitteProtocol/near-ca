import {
  Hex,
  isAddress,
  isHex,
  parseTransaction,
  serializeTransaction,
  TransactionSerializable,
  TypedDataDomain,
} from "viem";
import {
  EIP712TypedData,
  KeyPairString,
  SignMethod,
  TypedMessageTypes,
} from ".";

/**
 * Type guard to check if a value is a valid SignMethod
 *
 * @param method - The value to check
 * @returns True if the value is a valid SignMethod
 */
export function isSignMethod(method: unknown): method is SignMethod {
  return (
    typeof method === "string" &&
    [
      "eth_sign",
      "personal_sign",
      "eth_sendTransaction",
      "eth_signTypedData",
      "eth_signTypedData_v4",
    ].includes(method)
  );
}

/**
 * Type guard to check if a value is a valid TypedDataDomain
 * Validates all optional properties according to EIP-712 specification
 *
 * @param domain - The value to check
 * @returns True if the value matches TypedDataDomain structure
 */
export const isTypedDataDomain = (
  domain: unknown
): domain is TypedDataDomain => {
  if (typeof domain !== "object" || domain === null) return false;

  const candidate = domain as Record<string, unknown>;

  // Check that all properties, if present, are of the correct type
  return Object.entries(candidate).every(([key, value]) => {
    switch (key) {
      case "chainId":
        return (
          typeof value === "undefined" ||
          typeof value === "number" ||
          isHex(value) ||
          (typeof value === "string" && typeof parseInt(value) === "number")
        );
      case "name":
      case "version":
        return typeof value === "undefined" || typeof value === "string";
      case "verifyingContract":
        return (
          typeof value === "undefined" ||
          (typeof value === "string" && isAddress(value))
        );
      case "salt":
        return typeof value === "undefined" || typeof value === "string";
      default:
        return false; // Reject unknown properties
    }
  });
};

/**
 * Type guard to check if a value matches the TypedMessageTypes structure
 *
 * @param types - The value to check
 * @returns True if the value matches TypedMessageTypes structure
 */
const isTypedMessageTypes = (types: unknown): types is TypedMessageTypes => {
  if (typeof types !== "object" || types === null) return false;

  return Object.entries(types).every(([_, value]) => {
    return (
      Array.isArray(value) &&
      value.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "name" in item &&
          "type" in item &&
          typeof item.name === "string" &&
          typeof item.type === "string"
      )
    );
  });
};

/**
 * Type guard to check if a value is a valid EIP712TypedData
 * Validates the structure according to EIP-712 specification
 *
 * @param obj - The value to check
 * @returns True if the value matches EIP712TypedData structure
 */
export const isEIP712TypedData = (obj: unknown): obj is EIP712TypedData => {
  if (typeof obj !== "object" || obj === null) return false;

  const candidate = obj as Record<string, unknown>;

  return (
    "domain" in candidate &&
    "types" in candidate &&
    "message" in candidate &&
    "primaryType" in candidate &&
    isTypedDataDomain(candidate.domain) &&
    isTypedMessageTypes(candidate.types) &&
    typeof candidate.message === "object" &&
    candidate.message !== null &&
    typeof candidate.primaryType === "string"
  );
};

/**
 * Type guard to check if a value can be serialized as an Ethereum transaction
 * Attempts to serialize the input and returns true if successful
 *
 * @param data - The value to check
 * @returns True if the value can be serialized as a transaction
 */
export function isTransactionSerializable(
  data: unknown
): data is TransactionSerializable {
  try {
    serializeTransaction(data as TransactionSerializable);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Type guard to check if a value is a valid RLP-encoded transaction hex string
 * Attempts to parse the input as a transaction and returns true if successful
 *
 * @param data - The value to check
 * @returns True if the value is a valid RLP-encoded transaction hex
 */
export function isRlpHex(data: unknown): data is Hex {
  try {
    parseTransaction(data as Hex);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Type guard to check if a value is a valid NEAR key pair string
 *
 * @param value - The value to check
 * @returns True if the value is a valid KeyPairString format
 * @example
 * ```ts
 * isKeyPairString("ed25519:ABC123") // true
 * isKeyPairString("secp256k1:DEF456") // true
 * isKeyPairString("invalid:GHI789") // false
 * isKeyPairString("ed25519") // false
 * ```
 */
export function isKeyPairString(value: unknown): value is KeyPairString {
  if (typeof value !== "string") return false;

  const [prefix, key] = value.split(":");

  // Check if we have both parts and the prefix is valid
  if (!prefix || !key || !["ed25519", "secp256k1"].includes(prefix)) {
    return false;
  }

  // Check if the key part exists and is non-empty
  return key.length > 0;
}
