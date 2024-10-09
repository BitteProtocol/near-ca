import { Address, Hex, Signature, toHex } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { FunctionCallTransaction, SignArgs } from "../types";
import { Account } from "near-api-js";
import { IMpcContract, nearAccountFromAccountId, NearEthAdapter } from "..";

export async function signMpc(
  account: PrivateKeyAccount,
  payload: number[]
): Promise<Signature> {
  const hexSignature = await account.sign({
    hash: fromPayload(payload),
  });
  return hexToSignature(hexSignature);
}

export function fromPayload(payload: number[]): Hex {
  if (payload.length !== 32) {
    throw new Error(`Payload must have 32 bytes: ${payload}`);
  }
  // Convert number[] back to Uint8Array
  return toHex(new Uint8Array(payload));
}

/**
 * Converts a raw hexadecimal signature into a structured Signature object
 * @param hexSignature The raw hexadecimal signature (e.g., '0x...')
 * @returns A structured Signature object with fields r, s, v, and yParity
 */
function hexToSignature(hexSignature: string): Signature {
  // Remove the "0x" prefix if it exists
  const cleanedHex = hexSignature.startsWith("0x")
    ? hexSignature.slice(2)
    : hexSignature;

  // Ensure the signature is 65 bytes (130 hex characters)
  if (cleanedHex.length !== 130) {
    throw new Error(
      `Invalid hex signature length: ${cleanedHex.length}. Expected 130 characters (65 bytes).`
    );
  }

  // Extract the r, s, and v components from the hex signature
  const v = BigInt(`0x${cleanedHex.slice(128, 130)}`); // Last byte (2 hex characters)

  // Determine yParity based on v (27 or 28 maps to 0 or 1)
  const yParity = v === 27n ? 0 : v === 28n ? 1 : undefined;

  return {
    r: `0x${cleanedHex.slice(0, 64)}`, // First 32 bytes (64 hex characters)
    s: `0x${cleanedHex.slice(64, 128)}`, // Next 32 bytes (64 hex characters),
    v,
    yParity,
  };
}

// function toMpcSignature(signature: Signature): MPCSignature {
//   const { r, s, yParity } = signature;

//   return {
//     big_r: {
//       // Add "0x" prefix to the affine_point and ensure it matches the original structure
//       affine_point: `0x${r}`,
//     },
//     s: {
//       // Remove the "0x" prefix from s.scalar if present, or keep it as is
//       scalar: s.startsWith("0x") ? s.substring(2) : s,
//     },
//     // Use yParity directly as recovery_id
//     recovery_id: yParity ?? 0, // default to 0 if yParity is not defined
//   };
// }

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class MockMpcContract implements IMpcContract {
  connectedAccount: Account;
  private ethAccount: PrivateKeyAccount;

  constructor(account: Account, _privateKey?: string) {
    this.connectedAccount = account;
    this.ethAccount = privateKeyToAccount(
      // Known Key from deterministic ganache client
      "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    );
  }

  accountId(): string {
    return "mock-mpc.nonet";
  }

  deriveEthAddress = async (_unused?: string): Promise<Address> => {
    return this.ethAccount.address;
  };

  getDeposit = async (): Promise<string> => {
    return "1";
  };

  requestSignature = async (
    signArgs: SignArgs,
    _gas?: bigint
  ): Promise<Signature> => {
    return signMpc(this.ethAccount, signArgs.payload);
  };

  async encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>> {
    return {
      signerId: this.connectedAccount.accountId,
      receiverId: this.accountId(),
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "sign",
            args: { request: signArgs },
            gas: gas ? gas.toString() : "1",
            deposit: await this.getDeposit(),
          },
        },
      ],
    };
  }
}

export async function mockAdapter(
  accountId: string,
  privateKey?: string
): Promise<NearEthAdapter> {
  const account = await nearAccountFromAccountId(accountId, {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
  });
  const mpcContract = new MockMpcContract(account, privateKey);
  return NearEthAdapter.fromConfig({ mpcContract });
}
