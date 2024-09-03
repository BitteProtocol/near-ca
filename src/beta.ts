import { Hex, Signature, serializeSignature } from "viem";
import { addSignature, relaySignedTransaction } from "./utils/transaction";
import { NearEthTxData, signMethods } from "./types";
import { NearEthAdapter } from "./chains/ethereum";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { isSignMethod } from "./guards";
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
    request: Partial<Web3WalletTypes.SessionRequest>
  ): Promise<NearEthTxData> {
    const {
      chainId,
      request: { method, params },
    } = request.params!;
    console.log(`Session Request of type ${method} for chainId ${chainId}`);
    if (!isSignMethod(method)) {
      throw new Error(
        `Unsupported sign method ${method}: Available sign methods ${signMethods}`
      );
    }
    const { evmMessage, payload, recoveryData } = await requestRouter({
      method,
      chainId: parseInt(stripEip155Prefix(chainId)),
      params,
    });
    console.log("Parsed Request:", payload, recoveryData);
    return {
      nearPayload: await this.adapter.mpcContract.encodeSignatureRequestTx({
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
      return relaySignedTransaction(signedTx, false);
    }
    return serializeSignature(signature);
  }
}
