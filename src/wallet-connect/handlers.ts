import {
  Hex,
  TransactionSerializable,
  fromHex,
  hashMessage,
  hashTypedData,
  keccak256,
  serializeTransaction,
  toHex,
} from "viem";
import { populateTx, toPayload } from "../utils/transaction";
import { RecoveryData } from "../types/types";

// Interface for Ethereum transaction parameters
export interface EthTransactionParams {
  from: Hex;
  to: Hex;
  gas?: Hex;
  value?: Hex;
  data?: Hex;
}

// Interface for personal sign parameters (message and address)
export type PersonalSignParams = [Hex, Hex];

// Interface for complex structured parameters like EIP-712
export type TypedDataParams = [Hex, string];

type SessionRequestParams =
  | EthTransactionParams[]
  | PersonalSignParams
  | TypedDataParams;

export async function wcRouter(
  method: string,
  chainId: string,
  params: SessionRequestParams
): Promise<{
  evmMessage: TransactionSerializable | string;
  payload: number[];
  signatureRecoveryData: RecoveryData;
}> {
  switch (method) {
    case "eth_sign": {
      const [messageHash, sender] = params as PersonalSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        payload: toPayload(hashMessage(messageHash)),
        signatureRecoveryData: {
          type: "personal_sign",
          data: {
            address: sender,
            message: messageHash,
          },
        },
      };
    }
    case "personal_sign": {
      const [messageHash, sender] = params as PersonalSignParams;
      const message = fromHex(messageHash, "string");
      const prefixedMessage =
        "\x19Ethereum Signed Message:\n" + message.length + message;

      return {
        evmMessage: message,
        payload: toPayload(hashMessage(toHex(prefixedMessage))),
        signatureRecoveryData: {
          type: "personal_sign",
          data: {
            address: sender,
            message: prefixedMessage,
          },
        },
      };
    }
    case "eth_sendTransaction": {
      const tx = params[0] as EthTransactionParams;
      const transaction = await populateTx(
        {
          to: tx.to,
          chainId: parseInt(stripEip155Prefix(chainId)),
          value: fromHex(tx.value || "0x0", "bigint"),
          data: tx.data,
          gas: tx.gas ? fromHex(tx.gas, "bigint") : undefined,
        },
        tx.from
      );
      return {
        payload: toPayload(keccak256(serializeTransaction(transaction))),
        evmMessage: transaction,
        signatureRecoveryData: {
          type: "eth_sendTransaction",
          data: serializeTransaction(transaction),
        },
      };
    }
    case "eth_signTypedData":
    case "eth_signTypedData_v4": {
      const [sender, dataString] = params as TypedDataParams;
      const typedData = JSON.parse(dataString);
      console.log(
        `Received Typed Data signature request from ${sender}: ${JSON.stringify(typedData)}`
      );
      return {
        evmMessage: dataString,
        payload: toPayload(hashTypedData(typedData)),
        signatureRecoveryData: {
          type: "eth_signTypedData",
          data: {
            address: sender,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message,
            domain: typedData.domain,
          },
        },
      };
    }
  }
  throw new Error(`Unhandled session_request method: ${method}`);
}

function stripEip155Prefix(eip155Address: string): string {
  return eip155Address.split(":").pop() ?? "";
}
