import {
  Hash,
  Hex,
  PublicClient,
  TransactionSerializable,
  isBytes,
  keccak256,
  parseTransaction,
  serializeTransaction,
  toBytes,
  toHex,
} from "viem";
import { BaseTx, TransactionWithSignature } from "../types";
import { Network } from "../network";

/**
 * Converts a message hash to a payload array
 *
 * @param msgHash - The message hash to convert
 * @returns Array of numbers representing the payload
 * @throws Error if the payload length is not 32 bytes
 */
export function toPayload(msgHash: Hex | Uint8Array): number[] {
  const bytes = isBytes(msgHash) ? msgHash : toBytes(msgHash);
  if (bytes.length !== 32) {
    throw new Error(`Payload must have 32 bytes: ${msgHash}`);
  }
  return Array.from(bytes);
}

/**
 * Converts a payload array back to a hexadecimal string
 *
 * @param payload - The payload array to convert
 * @returns Hexadecimal string representation
 * @throws Error if the payload length is not 32 bytes
 */
export function fromPayload(payload: number[]): Hex {
  if (payload.length !== 32) {
    throw new Error(`Payload must have 32 bytes: ${payload}`);
  }
  // Convert number[] back to Uint8Array
  return toHex(new Uint8Array(payload));
}

/**
 * Builds a transaction payload from a serialized transaction
 *
 * @param serializedTx - The serialized transaction
 * @returns Array of numbers representing the transaction payload
 */
export function buildTxPayload(serializedTx: `0x${string}`): number[] {
  return toPayload(keccak256(serializedTx));
}

/**
 * Populates a transaction with necessary data
 *
 * @param tx - The base transaction data
 * @param from - The sender's address
 * @param client - Optional public client
 * @returns Complete transaction data
 * @throws Error if chain IDs don't match
 */
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
    nonce: tx.nonce ?? (await provider.getTransactionCount({ address: from })),
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

/**
 * Adds a signature to a transaction
 *
 * @param params - Object containing transaction and signature
 * @returns Serialized signed transaction
 */
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

/**
 * Relays a signed transaction to the Ethereum mempool
 *
 * @param serializedTransaction - The signed transaction to relay
 * @param wait - Whether to wait for confirmation
 * @returns Transaction hash
 */
export async function relaySignedTransaction(
  serializedTransaction: Hex,
  wait: boolean = true
): Promise<Hash> {
  const tx = parseTransaction(serializedTransaction);
  const network = Network.fromChainId(tx.chainId!);
  if (wait) {
    return network.client.sendRawTransaction({
      serializedTransaction,
    });
  } else {
    network.client.sendRawTransaction({
      serializedTransaction,
    });
    return keccak256(serializedTransaction);
  }
}

/**
 * Broadcasts a signed transaction to the Ethereum mempool
 *
 * @param tx - The signed transaction to broadcast
 * @returns Transaction hash
 */
export async function broadcastSignedTransaction(
  tx: TransactionWithSignature
): Promise<Hash> {
  const signedTx = addSignature(tx);
  return relaySignedTransaction(signedTx);
}
