import {
  Hex,
  Signature,
  fromHex,
  hashMessage,
  hashTypedData,
  keccak256,
  serializeSignature,
  serializeTransaction,
} from "viem";
import { addSignature, populateTx, toPayload } from "./utils/transaction";
import { NearEthTxData, RecoveryData } from "./types";
import { NearEthAdapter } from "./chains/ethereum";
import { Web3WalletTypes } from "@walletconnect/web3wallet";

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

/// Interface for complex structured parameters like EIP-712
export type TypedDataParams = [Hex, string];

export type SessionRequestParams =
  | EthTransactionParams[]
  | PersonalSignParams
  | EthSignParams
  | TypedDataParams;

export async function wcRouter(
  method: string,
  chainId: string,
  params: SessionRequestParams
): Promise<{
  evmMessage: string;
  payload: number[];
  recoveryData: RecoveryData;
}> {
  switch (method) {
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
      const txHex = serializeTransaction(transaction);
      return {
        payload: toPayload(keccak256(serializeTransaction(transaction))),
        evmMessage: txHex,
        recoveryData: {
          type: "eth_sendTransaction",
          data: txHex,
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
  throw new Error(`Unhandled session_request method: ${method}`);
}

function stripEip155Prefix(eip155Address: string): string {
  return eip155Address.split(":").pop() ?? "";
}

/**
 * Features currently underdevelopment that will be migrated into the adapter class once refined.
 * These features are accessible through the adapter class as `adapter.beta.methodName(...)`
 */
export class Beta {
  adapter: NearEthAdapter;

  constructor(adapter: NearEthAdapter) {
    this.adapter = adapter;
  }

  async handleSessionRequest(
    request: Partial<Web3WalletTypes.SessionRequest>
  ): Promise<NearEthTxData> {
    const {
      chainId,
      request: { method, params },
    } = request.params!;
    console.log(`Session Request of type ${method} for chainId ${chainId}`);
    const { evmMessage, payload, recoveryData } = await wcRouter(
      method,
      chainId,
      params
    );
    console.log("Parsed Request:", payload, recoveryData);
    return {
      nearPayload: this.adapter.mpcContract.encodeSignatureRequestTx({
        path: this.adapter.derivationPath,
        payload,
        key_version: 0,
      }),
      evmMessage,
      recoveryData,
    };
  }

  async respondSessionRequest(
    signature: Signature,
    transaction?: Hex
  ): Promise<Hex> {
    if (transaction) {
      const signedTx = addSignature({ transaction, signature });
      // Returns relayed transaction hash (without waiting for confirmation).
      return this.adapter.relaySignedTransaction(signedTx, false);
    }
    return serializeSignature(signature);
  }
}
