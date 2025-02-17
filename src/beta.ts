import { WalletKitTypes } from "@reown/walletkit";
import { Hex, Signature, serializeSignature } from "viem";
import {
  addSignature,
  relaySignedTransaction,
  toPayload,
} from "./utils/transaction";
import { isSignMethod, NearEncodedSignRequest, signMethods } from "./types";
import { NearEthAdapter } from "./chains/ethereum";
import { requestRouter } from "./utils/request";

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
    request: Partial<WalletKitTypes.SessionRequest>
  ): Promise<NearEncodedSignRequest> {
    const {
      chainId,
      request: { method, params },
    } = request.params!;
    if (!isSignMethod(method)) {
      throw new Error(
        `Unsupported sign method ${method}: Available sign methods ${signMethods}`
      );
    }
    const { evmMessage, hashToSign } = await requestRouter({
      method,
      chainId: parseInt(stripEip155Prefix(chainId)),
      params,
    });
    return {
      nearPayload: await this.adapter.mpcContract.encodeSignatureRequestTx({
        path: this.adapter.derivationPath,
        payload: toPayload(hashToSign),
        key_version: 0,
      }),
      evmMessage,
      hashToSign,
    };
  }

  async respondSessionRequest(
    signature: Signature,
    transaction?: Hex
  ): Promise<Hex> {
    if (transaction) {
      const signedTx = addSignature({ transaction, signature });
      // Returns relayed transaction hash (without waiting for confirmation).
      return relaySignedTransaction(signedTx, false);
    }
    return serializeSignature(signature);
  }
}
