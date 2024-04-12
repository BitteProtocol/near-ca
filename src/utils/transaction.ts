import {
  Address,
  Hex,
  bytesToHex,
  hexToBytes,
  hexToNumber,
  keccak256,
  parseTransaction,
  serializeTransaction,
  signatureToHex,
  hexToBigInt,
} from "viem";
import { TransactionWithSignature } from "../types";
import { secp256k1 } from "@noble/curves/secp256k1";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

export function buildTxPayload(unsignedTxHash: `0x${string}`): number[] {
  // Compute the Transaction Message Hash.
  const messageHash = keccak256(unsignedTxHash);
  return Array.from(hexToBytes(messageHash).slice().reverse());
}

export function ethersJsAddSignature(
  tx: TransactionWithSignature,
  sender: Address
): Hex {
  const {
    transaction: unsignedTxHash,
    signature: { big_r, big_s },
  } = tx;
  const transaction = FeeMarketEIP1559Transaction.fromSerializedTx(
    hexToBytes(unsignedTxHash)
  );
  const r = hexToBigInt(`0x${big_r.substring(2)}`);
  const s = hexToBigInt(`0x${big_s}`);

  const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
  const signature = candidates.find((c) => {
    return (
      c.getSenderAddress().toString().toLowerCase() ===
      sender.toString().toLowerCase()
    );
  });

  if (!signature) {
    throw new Error("Signature is not valid");
  }
  return bytesToHex(signature.serialize());
}

export function viemAddSig(
  { transaction, signature: { big_r, big_s } }: TransactionWithSignature,
  sender: Address
): Hex {
  const txData = parseTransaction(transaction);
  const r = `0x${big_r.substring(2)}` as Hex;
  const s = `0x${big_s}` as Hex;

  const candidates = [0, 1].map((v) => {
    return {
      yParity: v,
      r,
      s,
      ...txData,
    };
  });
  const signature = candidates.find(async (tx) => {
    const signature = signatureToHex({
      r: tx.r!,
      s: tx.s!,
      yParity: tx.yParity!,
    });
    const pk = recoverPublicKey(transaction, signature);
    return pk.toString().toLowerCase() === sender.toLowerCase();
  });
  if (!signature) {
    throw new Error("Signature is not valid");
  }

  return serializeTransaction(signature);
}

// export function addSignature(
//   tx: TransactionWithSignature,
//   sender: Address
// ): Hex {
//   return viemAddSig(tx, sender);
// }

// This method is mostly pasted from viem since they use an unnecessary async import.
// import { secp256k1 } from "@noble/curves/secp256k1";
// Somehow this method also seems to return the wrong parity...
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
