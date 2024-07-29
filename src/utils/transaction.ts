import {
  Hex,
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
  from: Hex
): Promise<TransactionSerializable> {
  const network = Network.fromChainId(tx.chainId);
  const transactionData = {
    nonce:
      tx.nonce ||
      (await network.client.getTransactionCount({
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
      tx.gas || network.client.estimateGas(transactionData),
      network.client.estimateFeesPerGas(),
    ]);
  return {
    ...transactionData,
    gas: estimatedGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: network.chainId,
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
