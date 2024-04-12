import {
  Address,
  Hex,
  RecoverPublicKeyParameters,
  RecoverPublicKeyReturnType,
  bytesToHex,
  hexToBytes,
  hexToNumber,
  isHex,
  keccak256,
  parseTransaction,
  serializeTransaction,
  signatureToHex,
  toHex,
} from "viem";
import { TransactionWithSignature } from "../types";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { secp256k1 } from "@noble/curves/secp256k1";

export function ethersJsAddSignature(
  tx: TransactionWithSignature,
  sender: Address
): Hex {
  const { transaction: unsignedTxHash, signature: sig } = tx;
  const transaction = FeeMarketEIP1559Transaction.fromSerializedTx(
    hexToBytes(unsignedTxHash)
  );
  const r = Buffer.from(sig.big_r.substring(2), "hex");
  const s = Buffer.from(sig.big_s, "hex");

  const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
  const signature = candidates.find(
    (c) =>
      c.getSenderAddress().toString().toLowerCase() ===
      sender.toString().toLowerCase()
  );

  if (!signature) {
    throw new Error("Signature is not valid");
  }
  return bytesToHex(signature.serialize());
}

export async function viemAddSig(
  { transaction, signature: sig }: TransactionWithSignature,
  sender: Address
): Promise<Hex> {
  const txData = parseTransaction(transaction);
  const candidates = [0, 1].map((v) => {
    return {
      yParity: v,
      r: `0x${sig.big_r.substring(2)}` as Hex,
      s: `0x${sig.big_s}` as Hex,
      ...txData,
    };
  });
  const signature = candidates.find(async (tx) => {
    const signature = signatureToHex({
      r: tx.r!,
      s: tx.s!,
      // v: tx.v!,
      yParity: tx.yParity!,
    });
    const pk = recoverPublicKey({
      hash: serializeTransaction(tx),
      signature,
    });
    return pk.toString().toLowerCase() === sender.toLowerCase();
  });
  if (!signature) {
    throw new Error("Signature is not valid");
  }

  return serializeTransaction(signature);
}

export async function addSignature(
  tx: TransactionWithSignature,
  sender: Address
): Promise<Hex> {
  return viemAddSig(tx, sender);
}

export function buildTxPayload(unsignedTxHash: `0x${string}`): number[] {
  // Compute the Transaction Message Hash.
  const messageHash = keccak256(unsignedTxHash);
  return Array.from(hexToBytes(messageHash).slice().reverse());
}

// This method is
export function recoverPublicKey({
  hash,
  signature,
}: RecoverPublicKeyParameters): RecoverPublicKeyReturnType {
  const signatureHex = isHex(signature) ? signature : toHex(signature);
  const hashHex = isHex(hash) ? hash : toHex(hash);

  // Derive v = recoveryId + 27 from end of the signature (27 is added when signing the message)
  // The recoveryId represents the y-coordinate on the secp256k1 elliptic curve and can have a value [0, 1].
  let v = hexToNumber(`0x${signatureHex.slice(130)}`);
  if (v === 0 || v === 1) v += 27;

  const publicKey = secp256k1.Signature.fromCompact(
    signatureHex.substring(2, 130)
  )
    .addRecoveryBit(v - 27)
    .recoverPublicKey(hashHex.substring(2))
    .toHex(false);
  return `0x${publicKey}`;
}

// export function getSenderPublicKey(tx: LegacyTxInterface): Uint8Array {
//   if (tx.cache.senderPubKey !== undefined) {
//     return tx.cache.senderPubKey
//   }

//   const msgHash = tx.getMessageToVerifySignature()

//   const { v, r, s } = tx

//   validateHighS(tx)

//   try {
//     const ecrecoverFunction = tx.common.customCrypto.ecrecover ?? ecrecover
//     const sender = ecrecoverFunction(
//       msgHash,
//       v!,
//       bigIntToUnpaddedBytes(r!),
//       bigIntToUnpaddedBytes(s!),
//       tx.supports(Capability.EIP155ReplayProtection) ? tx.common.chainId() : undefined
//     )
//     if (Object.isFrozen(tx)) {
//       tx.cache.senderPubKey = sender
//     }
//     return sender
//   } catch (e: any) {
//     const msg = errorMsg(tx, 'Invalid Signature')
//     throw new Error(msg)
//   }
// }
