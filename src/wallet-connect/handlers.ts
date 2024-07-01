import {
  Hex,
  TransactionSerializable,
  fromHex,
  hashMessage,
  hashTypedData,
  keccak256,
  serializeTransaction,
  verifyMessage,
  verifyTypedData,
} from "viem";
import { populateTx, toPayload } from "../utils/transaction";
import { MessageData, RecoveryData, TypedMessageData } from "../types/types";
import { pickValidSignature } from "../utils/signature";

// Interface for Ethereum transaction parameters
export interface EthTransactionParams {
  from: Hex;
  to: Hex;
  gas?: Hex;
  value?: Hex;
  data?: Hex;
}

/// Interface for personal sign parameters (message and address)
export type PersonalSignParams = [Hex, Hex];

/// Interface for eth_sign parameters (address and message)
export type EthSignParams = [Hex, Hex];

// Interface for complex structured parameters like EIP-712
export type TypedDataParams = [Hex, string];

type SessionRequestParams =
  | EthTransactionParams[]
  | PersonalSignParams
  | EthSignParams
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
      const [sender, messageHash] = params as EthSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        payload: toPayload(hashMessage({ raw: messageHash })),
        signatureRecoveryData: {
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
        signatureRecoveryData: {
          type: method,
          data: {
            address: sender,
            message: { raw: messageHash },
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
          data: tx.data || "0x",
          ...(tx.gas ? { gas: fromHex(tx.gas, "bigint") } : {}),
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

export async function offChainRecovery(
  recoveryData: RecoveryData,
  sigs: [Hex, Hex]
): Promise<Hex> {
  let validity: [boolean, boolean];
  if (recoveryData.type === "personal_sign") {
    validity = await Promise.all([
      verifyMessage({
        signature: sigs[0],
        ...(recoveryData.data as MessageData),
      }),
      verifyMessage({
        signature: sigs[1],
        ...(recoveryData.data as MessageData),
      }),
    ]);
  } else if (recoveryData.type === "eth_signTypedData") {
    validity = await Promise.all([
      verifyTypedData({
        signature: sigs[0],
        ...(recoveryData.data as TypedMessageData),
      }),
      verifyTypedData({
        signature: sigs[1],
        ...(recoveryData.data as TypedMessageData),
      }),
    ]);
  } else {
    throw new Error("Invalid Path");
  }
  return pickValidSignature(validity, sigs);
}

function stripEip155Prefix(eip155Address: string): string {
  return eip155Address.split(":").pop() ?? "";
}
