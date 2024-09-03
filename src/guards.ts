import { SignMethod } from "./types";

export function isSignMethod(method: string): method is SignMethod {
  return [
    "eth_sign",
    "personal_sign",
    "eth_sendTransaction",
    "eth_signTypedData",
    "eth_signTypedData_v4",
  ].includes(method);
}
