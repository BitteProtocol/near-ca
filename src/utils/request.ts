import {
  Hex,
  fromHex,
  hashMessage,
  hashTypedData,
  isHex,
  keccak256,
  serializeTransaction,
} from "viem";
import { populateTx } from "./transaction";
import {
  EncodedSignRequest,
  EthSignParams,
  EthTransactionParams,
  PersonalSignParams,
  SignRequestData,
  TypedDataParams,
} from "../types";

/**
 * Handles routing of signature requests based on the provided method, chain ID, and parameters.
 *
 * @async
 * @function requestRouter
 * @param {SignRequestData} params - An object containing the method, chain ID, and request parameters.
 * @returns {Promise<NearEncodedSignRequest>}
 * - Returns a promise that resolves to an object containing the Ethereum Virtual Machine (EVM) message,
 *   the payload (hashed data), and recovery data needed for reconstructing the signature request.
 */
export async function requestRouter({
  method,
  chainId,
  params,
}: SignRequestData): Promise<EncodedSignRequest> {
  switch (method) {
    case "eth_sign": {
      const [_, messageHash] = params as EthSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        hashToSign: hashMessage({ raw: messageHash }),
      };
    }
    case "personal_sign": {
      const [messageHash, _] = params as PersonalSignParams;
      return {
        evmMessage: fromHex(messageHash, "string"),
        hashToSign: hashMessage({ raw: messageHash }),
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
        hashToSign: keccak256(rlpTx),
        evmMessage: rlpTx,
      };
    }
    case "eth_signTypedData":
    case "eth_signTypedData_v4": {
      const [_, dataString] = params as TypedDataParams;
      const typedData = JSON.parse(dataString);
      return {
        evmMessage: dataString,
        hashToSign: hashTypedData(typedData),
      };
    }
  }
}
