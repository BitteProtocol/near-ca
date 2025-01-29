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
 * Routes signature requests to appropriate handlers based on method type
 *
 * @param request - The signature request data
 * @returns Object containing the EVM message, payload hash, and recovery data
 */
export async function requestRouter(
  request: SignRequestData
): Promise<EncodedSignRequest> {
  const { method, chainId, params } = request;
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
