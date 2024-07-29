import { Signature } from "viem";
import { JSONRPCResponse } from "../types/rpc";
import { MPCSignature } from "../types/types";
import {
  FinalExecutionOutcome,
  FinalExecutionStatus,
} from "near-api-js/lib/providers";

export async function signatureFromTxHash(
  nodeUrl: string,
  txHash: string,
  /// This field doesn't appear to be necessary although (possibly for efficiency),
  /// the docs mention that it is "used to determine which shard to query for transaction".
  accountId: string = "non-empty"
): Promise<Signature> {
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
  // TODO: Find an example when successValue isn't available and we need to enter this block.
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
    const signature: MPCSignature = JSON.parse(decodedValue);
    return transformSignature(signature);
  } else {
    throw new Error(`No valid values found in transaction receipt ${txHash}`);
  }
}

export function transformSignature(mpcSig: MPCSignature): Signature {
  const { big_r, s, recovery_id } = mpcSig;
  return {
    r: `0x${big_r.affine_point.substring(2)}`,
    s: `0x${s.scalar}`,
    yParity: recovery_id,
  };
}

export async function signatureFromOutcome(
  outcome: FinalExecutionOutcome
): Promise<Signature> {
  // TODO: Find example outcome when status is not of this casted type.
  const b64Sig = (outcome.status as FinalExecutionStatus).SuccessValue!;
  const decodedValue = Buffer.from(b64Sig, "base64").toString("utf-8");
  const signature = JSON.parse(decodedValue);
  return transformSignature(signature);
}
