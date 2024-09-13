import {
  Hash,
  Hex,
  fromHex,
  hashMessage,
  hashTypedData,
  isHash,
  isHex,
  keccak256,
  serializeTransaction,
} from "viem";
import { populateTx, toPayload } from "./transaction";
import {
  EthSignParams,
  EthTransactionParams,
  PersonalSignParams,
  RecoveryData,
  SignRequestData,
  TypedDataParams,
} from "../types";

/**
 * Handles routing of signature requests based on the provided method, chain ID, and parameters.
 *
 * @async
 * @function requestRouter
 * @param {SignRequestData} params - An object containing the method, chain ID, and request parameters.
 * @returns {Promise<{ evmMessage: string; payload: number[]; recoveryData: RecoveryData }>}
 * - Returns a promise that resolves to an object containing the Ethereum Virtual Machine (EVM) message,
 *   the payload (hashed data), and recovery data needed for reconstructing the signature request.
 */
export async function requestRouter({
  method,
  chainId,
  params,
}: SignRequestData): Promise<{
  evmMessage: string;
  payload: number[];
  // We may eventually be able to abolish this.
  recoveryData: RecoveryData;
}> {
  switch (method) {
    case "hash": {
      console.warn("Unsafe hash without context sign request");
      const hash = params as Hash;
      return {
        payload: toPayload(hash),
        // These should be more.
        evmMessage: hash,
        recoveryData: { type: "hash", data: hash },
      };
    }
    case "eth_sign": {
      const [sender, messageHash] = params as EthSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        payload: toPayload(hashMessage({ raw: messageHash })),
        recoveryData: {
          type: method,
          data: {
            address: sender,
            message: { raw: messageHash },
          },
        },
      };
    }
    case "personal_sign": {
      const [messageHash, sender] = params as PersonalSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        payload: toPayload(hashMessage({ raw: messageHash })),
        recoveryData: {
          type: method,
          data: {
            address: sender,
            message: { raw: messageHash },
          },
        },
      };
    }
    case "eth_sendTransaction": {
      // We only support one transaction at a time!
      let rlpTx: Hex;
      if (isHex(params)) {
        rlpTx = params;
      } else {
        const tx = params[0] as EthTransactionParams;
        const transaction = await populateTx(
          {
            to: tx.to,
            chainId,
            value: fromHex(tx.value || "0x0", "bigint"),
            data: tx.data || "0x",
            ...(tx.gas ? { gas: fromHex(tx.gas, "bigint") } : {}),
          },
          tx.from
        );
        rlpTx = serializeTransaction(transaction);
      }

      return {
        payload: toPayload(keccak256(rlpTx)),
        evmMessage: rlpTx,
        recoveryData: {
          type: "eth_sendTransaction",
          data: rlpTx,
        },
      };
    }
    case "eth_signTypedData":
    case "eth_signTypedData_v4": {
      const [sender, dataString] = params as TypedDataParams;
      const typedData = JSON.parse(dataString);
      return {
        evmMessage: dataString,
        payload: toPayload(hashTypedData(typedData)),
        recoveryData: {
          type: "eth_signTypedData",
          data: {
            address: sender,
            ...typedData,
          },
        },
      };
    }
  }
}
