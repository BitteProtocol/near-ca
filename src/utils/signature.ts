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
  const txHash = outcome.transaction_outcome?.id;
  // TODO - find a scenario when outcome.status is `FinalExecutionStatusBasic`!
  let b64Sig = (outcome.status as FinalExecutionStatus).SuccessValue;
  if (!b64Sig) {
    // This scenario occurs when sign call is relayed (i.e. executed by someone else).
    // E.g. https://testnet.nearblocks.io/txns/G1f1HVUxDBWXAEimgNWobQ9yCx1EgA2tzYHJBFUfo3dj
    // We have to dig into `receipts_outcome` and extract the signature from within.
    // We want the second occurence of the signature because
    // the first is nested inside `{ Ok: MPCSignature }`)
    b64Sig = outcome.receipts_outcome
      // Map to get SuccessValues: The Signature will appear twice.
      .map(
        (receipt) =>
          (receipt.outcome.status as FinalExecutionStatus).SuccessValue
      )
      // Reverse the to "find" the last non-empty value!
      .reverse()
      .find((value) => value && value.trim().length > 0);
  }
  if (!b64Sig) {
    throw new Error(`No detectable signature found in transaction ${txHash}`);
  }
  if (b64Sig === "eyJFcnIiOiJGYWlsZWQifQ==") {
    // {"Err": "Failed"}
    throw new Error(`Signature Request Failed in ${txHash}`);
  }
  const decodedValue = Buffer.from(b64Sig, "base64").toString("utf-8");
  const signature = JSON.parse(decodedValue);
  if (isMPCSignature(signature)) {
    return transformSignature(signature);
  } else {
    throw new Error(`No detectable signature found in transaction ${txHash}`);
  }
}

// type guard for MPCSignature object.
function isMPCSignature(obj: unknown): obj is MPCSignature {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as MPCSignature).big_r === "object" &&
    typeof (obj as MPCSignature).big_r.affine_point === "string" &&
    typeof (obj as MPCSignature).s === "object" &&
    typeof (obj as MPCSignature).s.scalar === "string" &&
    typeof (obj as MPCSignature).recovery_id === "number"
  );
}
