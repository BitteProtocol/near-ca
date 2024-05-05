import { JSONRPCResponse, ReceiptOutcome } from "../types/rpc";

export async function signatureFromTxHash(
  txHash: string,
  accountId: string
): Promise<[string, string]> {
  const url: string = "https://archival-rpc.testnet.near.org";
  const payload = {
    jsonrpc: "2.0",
    id: "dontcare",
    method: "EXPERIMENTAL_tx_status",
    params: [txHash, accountId],
  };

  // Make the POST request with the fetch API
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const jsonResponse = (await response.json()) as JSONRPCResponse;

  const receiptsOutcome = jsonResponse.result.receipts_outcome;
  const successValues = receiptsOutcome.map(
    (outcome: ReceiptOutcome) => outcome.outcome.status.SuccessValue
  );

  // Find the first non-undefined value
  const firstValidValue = successValues.find((value) => value !== undefined);

  if (firstValidValue) {
    // Decode from base64
    const decodedValue = Buffer.from(firstValidValue, "base64").toString(
      "utf-8"
    );
    return JSON.parse(decodedValue);
  } else {
    throw new Error("No valid values found in the array.");
  }
}
