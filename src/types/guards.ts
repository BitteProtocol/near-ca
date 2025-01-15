import {
  Hex,
  isAddress,
  isHex,
  parseTransaction,
  serializeTransaction,
  TransactionSerializable,
  TypedDataDomain,
} from "viem";
import { EIP712TypedData, SignMethod, TypedMessageTypes } from ".";

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

// Cheeky attempt to serialize. return true if successful!
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

export function isRlpHex(data: unknown): data is Hex {
  try {
    parseTransaction(data as Hex);
    return true;
  } catch (error) {
    return false;
  }
}
