import { JSONRPCResponse } from "../types/rpc";

export async function signatureFromTxHash(
  nodeUrl: string,
  txHash: string,
  /// This field doesn't appear to be necessary although (possibly for efficiency),
  /// the docs mention that it is "used to determine which shard to query for transaction".
  accountId: string = "non-empty"
): Promise<[string, string]> {
  const payload = {
    jsonrpc: "2.0",
    id: "dontcare",
    // This could be replaced with `tx`.
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
  const base64Sig = jsonResponse.result.status.SuccessValue;

  if (base64Sig) {
    // Decode from base64
    const decodedValue = Buffer.from(base64Sig, "base64").toString("utf-8");
    return JSON.parse(decodedValue);
  } else {
    throw new Error("No valid values found in the array.");
  }
}
