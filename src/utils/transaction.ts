import {
  Address,
  Hex,
  hexToBytes,
  hexToNumber,
  keccak256,
  parseTransaction,
  serializeTransaction,
  signatureToHex,
} from "viem";
import { TransactionWithSignature } from "../types/types";
import { secp256k1 } from "@noble/curves/secp256k1";

import { publicKeyToAddress } from "viem/utils";

export function buildTxPayload(unsignedTxHash: `0x${string}`): number[] {
  // Compute the Transaction Message Hash.
  const messageHash = keccak256(unsignedTxHash);
  return Array.from(hexToBytes(messageHash).slice().reverse());
}

export function addSignature(
  { transaction, signature: { big_r, big_s } }: TransactionWithSignature,
  sender: Address
): Hex {
  const txData = parseTransaction(transaction);
  const r = `0x${big_r.substring(2)}` as Hex;
  const s = `0x${big_s}` as Hex;

  const candidates = [27n, 28n].map((v) => {
    return {
      v,
      r,
      s,
      ...txData,
    };
  });

  const signedTx = candidates.find((tx) => {
    const signature = signatureToHex({
      r: tx.r!,
      s: tx.s!,
      v: tx.v!,
    });
    const pk = publicKeyToAddress(
      recoverPublicKey(keccak256(transaction), signature)
    );
    return pk.toLowerCase() === sender.toLowerCase();
  });
  if (!signedTx) {
    throw new Error("Signature is not valid");
  }
  return serializeTransaction(signedTx);
}

// This method is mostly pasted from viem since they use an unnecessary async import.
// import { secp256k1 } from "@noble/curves/secp256k1";
// TODO - fix their async import!
export function recoverPublicKey(hash: Hex, signature: Hex): Hex {
  // Derive v = recoveryId + 27 from end of the signature (27 is added when signing the message)
  // The recoveryId represents the y-coordinate on the secp256k1 elliptic curve and can have a value [0, 1].
  let v = hexToNumber(`0x${signature.slice(130)}`);
  if (v === 0 || v === 1) v += 27;

  const publicKey = secp256k1.Signature.fromCompact(signature.substring(2, 130))
    .addRecoveryBit(v - 27)
    .recoverPublicKey(hash.substring(2))
    .toHex(false);
  return `0x${publicKey}`;
}
