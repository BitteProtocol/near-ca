import { Hash } from "viem";
import { JSONRPCResponse } from "../types/rpc";
import { MPCSignature } from "../types/types";

export async function signatureFromTxHash(
  nodeUrl: string,
  txHash: string,
  /// This field doesn't appear to be necessary although (possibly for efficiency),
  /// the docs mention that it is "used to determine which shard to query for transaction".
  accountId: string = "non-empty"
): Promise<MPCSignature> {
  const payload = {
    jsonrpc: "2.0",
    id: "dontcare",
    // This could be replaced with `tx`.
    // method: "tx",
    method: "EXPERIMENTAL_tx_status",
    params: [txHash, accountId],
  };

  // Make the POST request with the fetch API
  const response = await fetch(nodeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const jsonResponse = (await response.json()) as JSONRPCResponse;
  let base64Sig = jsonResponse.result.status?.SuccessValue;
  if (base64Sig === "") {
    // Extract receipts_outcome
    const receiptsOutcome = jsonResponse.result.receipts_outcome;
    // Map to get SuccessValue
    const successValues = receiptsOutcome.map(
      // eslint-disable-next-line
      (outcome: any) => outcome.outcome.status.SuccessValue
    );
    // Find the first non-empty value
    base64Sig = successValues.find((value) => value && value.trim().length > 0);
  }
  if (base64Sig) {
    const decodedValue = Buffer.from(base64Sig, "base64").toString("utf-8");
    const [big_r, big_s] = JSON.parse(decodedValue);
    return { big_r, big_s };
  } else {
    throw new Error("No valid values found in the array.");
  }
}

export function pickValidSignature(
  [valid0, valid1]: [boolean, boolean],
  [sig0, sig1]: [Hash, Hash]
): Hash {
  if (!valid0 && !valid1) {
    throw new Error("Invalid signature");
  } else if (valid0) {
    return sig0;
  } else {
    return sig1;
  }
}
