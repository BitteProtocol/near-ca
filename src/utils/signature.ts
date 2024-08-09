import { Signature } from "viem";
import { MPCSignature } from "../types";
import {
  FinalExecutionOutcome,
  FinalExecutionStatus,
} from "near-api-js/lib/providers";

// Basic structure of the JSON-RPC response
export interface JSONRPCResponse<T> {
  jsonrpc: string;
  id: number | string | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

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
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json: JSONRPCResponse<FinalExecutionOutcome> = await response.json();

  if (json.error) {
    throw new Error(`JSON-RPC error: ${json.error.message}`);
  }

  if (json.result) {
    return signatureFromOutcome(json.result);
  } else {
    throw new Error(`No FinalExecutionOutcome in response: ${json}`);
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

export function signatureFromOutcome(
  // The Partial object is intended to make up for the
  // difference between all the different near-api versions and wallet-selector bullshit
  // the field `final_execution_status` is in one, but not the other and we don't use it anyway.
  outcome:
    | FinalExecutionOutcome
    | Omit<FinalExecutionOutcome, "final_execution_status">
): Signature {
  let b64Sig = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (b64Sig === "") {
    // Extract receipts_outcome
    const receiptsOutcome = outcome.receipts_outcome;
    // Map to get SuccessValues
    const successValues = receiptsOutcome.map(
      (outcome) => (outcome.outcome.status as FinalExecutionStatus).SuccessValue
    );
    // Find the last non-empty value
    b64Sig = successValues
      .reverse()
      .find((value) => value && value.trim().length > 0);
  }
  if (b64Sig) {
    const decodedValue = Buffer.from(b64Sig, "base64").toString("utf-8");
    const signature = JSON.parse(decodedValue);
    // Ok happens
    // return transformSignature("Ok" in signature ? signature.Ok : signature);
    return transformSignature(signature);
  }
  throw new Error(
    `No detectable signature found in transaction ${outcome.transaction_outcome?.id}`
  );
}
