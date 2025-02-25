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

/**
 * Removes the EIP-155 prefix from an address string
 *
 * @param eip155Address - The EIP-155 formatted address
 * @returns The address without the EIP-155 prefix
 */
function stripEip155Prefix(eip155Address: string): string {
  return eip155Address.split(":").pop() ?? "";
}

/**
 * Features currently under development that will be migrated into the adapter class once refined.
 * These features are accessible through the adapter class as `adapter.beta.methodName(...)`
 */
export class Beta {
  adapter: NearEthAdapter;

  /**
   * Creates a new Beta instance
   *
   * @param adapter - The NearEthAdapter instance to use
   */
  constructor(adapter: NearEthAdapter) {
    this.adapter = adapter;
  }

  /**
   * Handles a WalletConnect session request by encoding it for NEAR
   *
   * @param request - The WalletConnect session request
   * @returns The encoded request for NEAR
   * @throws Error if the sign method is not supported
   */
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

  /**
   * Responds to a session request with a signature
   *
   * @param signature - The signature to respond with
   * @param transaction - Optional transaction hex
   * @returns The serialized signature or transaction hash
   */
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
