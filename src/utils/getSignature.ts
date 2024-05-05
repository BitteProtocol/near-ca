import { JSONRPCResponse } from "../types/rpc";

export async function signatureFromTxHash(
  nodeUrl: string,
  txHash: string
): Promise<[string, string]> {
  const payload = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "EXPERIMENTAL_tx_status",
    params: [txHash, "useless-parameter"],
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
