import {
  Address,
  Hex,
  bytesToHex,
  hexToBytes,
  keccak256,
  parseTransaction,
  recoverPublicKey,
  serializeTransaction,
  signatureToHex,
} from "viem";
import { TransactionWithSignature } from "../types";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";

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
    const pk = await recoverPublicKey({
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

export async function buildTxPayload(
  unsignedTxHash: `0x${string}`
): Promise<number[]> {
  // Compute the Transaction Message Hash.
  const messageHash = await keccak256(unsignedTxHash);
  return Array.from(hexToBytes(messageHash).slice().reverse());
}
