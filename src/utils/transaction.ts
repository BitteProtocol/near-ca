import {
  Hex,
  PublicClient,
  TransactionSerializable,
  keccak256,
  parseTransaction,
  serializeTransaction,
  toBytes,
} from "viem";
import { BaseTx, TransactionWithSignature } from "../types/types";
import { Network } from "../network";

export function toPayload(hexString: Hex): number[] {
  if (hexString.slice(2).length !== 32 * 2) {
    throw new Error(`Payload Hex must have 32 bytes: ${hexString}`);
  }
  return Array.from(toBytes(hexString));
}

export function buildTxPayload(unsignedTxHash: `0x${string}`): number[] {
  return toPayload(keccak256(unsignedTxHash));
}

export async function populateTx(
  tx: BaseTx,
  from: Hex,
  client?: PublicClient
): Promise<TransactionSerializable> {
  const provider = client || Network.fromChainId(tx.chainId).client;
  const chainId = await provider.getChainId();
  if (chainId !== tx.chainId) {
    // Can only happen when client is provided.
    throw new Error(
      `client chainId=${chainId} mismatch with tx.chainId=${tx.chainId}`
    );
  }
  const transactionData = {
    nonce:
      tx.nonce ||
      (await provider.getTransactionCount({
        address: from,
      })),
    account: from,
    to: tx.to,
    value: tx.value ?? 0n,
    data: tx.data ?? "0x",
  };
  const [estimatedGas, { maxFeePerGas, maxPriorityFeePerGas }] =
    await Promise.all([
      // Only estimate gas if not provided.
      tx.gas || provider.estimateGas(transactionData),
      provider.estimateFeesPerGas(),
    ]);
  return {
    ...transactionData,
    gas: estimatedGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId,
  };
}

export function addSignature({
  transaction,
  signature,
}: TransactionWithSignature): Hex {
  const txData = parseTransaction(transaction);
  const signedTx = {
    ...signature,
    ...txData,
  };
  return serializeTransaction(signedTx);
}
