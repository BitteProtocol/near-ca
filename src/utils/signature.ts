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
  const base64Sig = jsonResponse.result.status?.SuccessValue;
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

export function signatureFromOutcome(
  // The Partial object is intended to make up for the
  // difference between all the different near-api versions and wallet-selector bullshit
  // the field `final_execution_status` is in one, but not the other and we don't use it anyway.
  outcome: FinalExecutionOutcome | Partial<FinalExecutionOutcome>
): Signature {
  // TODO: Find example outcome when status is not of this casted type.
  const b64Sig = (outcome.status as FinalExecutionStatus).SuccessValue!;
  const decodedValue = Buffer.from(b64Sig, "base64").toString("utf-8");
  const signature = JSON.parse(decodedValue);
  return transformSignature(signature);
}
