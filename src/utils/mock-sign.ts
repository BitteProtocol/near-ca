import { Address, Hex, Signature } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { FunctionCallTransaction, SignArgs } from "../types";
import { Account } from "near-api-js";
import {
  fromPayload,
  IMpcContract,
  nearAccountFromAccountId,
  NearEthAdapter,
} from "..";

/**
 * Converts a raw hexadecimal signature into a structured Signature object
 *
 * @param hexSignature - The raw hexadecimal signature (e.g., '0x...')
 * @returns A structured Signature object with fields r, s, v, and yParity
 * @throws Error if signature length is invalid
 */
function hexToSignature(hexSignature: Hex): Signature {
  const cleanedHex = hexSignature.slice(2);

  if (cleanedHex.length !== 130) {
    throw new Error(
      `Invalid hex signature length: ${cleanedHex.length}. Expected 130 characters (65 bytes).`
    );
  }

  const v = BigInt(`0x${cleanedHex.slice(128, 130)}`);
  return {
    r: `0x${cleanedHex.slice(0, 64)}`,
    s: `0x${cleanedHex.slice(64, 128)}`,
    v,
    yParity: v === 27n ? 0 : v === 28n ? 1 : undefined,
  };
}

/** Mock implementation of the MPC Contract interface for testing */
export class MockMpcContract implements IMpcContract {
  connectedAccount: Account;
  private ethAccount: PrivateKeyAccount;

  /**
   * Creates a new mock MPC contract instance
   *
   * @param account - The NEAR account to use
   * @param privateKey - Optional private key (defaults to deterministic test key)
   */
  constructor(account: Account, privateKey?: Hex) {
    this.connectedAccount = account;
    this.ethAccount = privateKeyToAccount(
      privateKey ||
        "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    );
  }

  /** Gets the mock contract ID */
  accountId(): string {
    return "mock-mpc.offline";
  }

  /**
   * Returns the mock Ethereum address
   *
   * @returns The Ethereum address associated with the private key
   */
  deriveEthAddress = async (_unused?: string): Promise<Address> => {
    return this.ethAccount.address;
  };

  /**
   * Returns a mock deposit amount
   *
   * @returns A constant deposit value of "1"
   */
  getDeposit = async (): Promise<string> => {
    return "1";
  };

  /**
   * Signs a message using the mock private key
   *
   * @param signArgs - The signature request arguments
   * @returns The signature
   */
  requestSignature = async (signArgs: SignArgs): Promise<Signature> => {
    const hexSignature = await this.ethAccount.sign({
      hash: fromPayload(signArgs.payload),
    });
    return hexToSignature(hexSignature);
  };

  /**
   * Encodes a mock signature request transaction
   *
   * @param signArgs - The signature request arguments
   * @param gas - Optional gas limit
   * @returns The encoded transaction
   */
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

/**
 * Creates a mock adapter instance for testing
 *
 * @param privateKey - Optional private key for the mock contract
 * @returns A configured NearEthAdapter instance
 */
export async function mockAdapter(privateKey?: Hex): Promise<NearEthAdapter> {
  const account = await nearAccountFromAccountId("mock-user.offline", {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
  });
  const mpcContract = new MockMpcContract(account, privateKey);
  return NearEthAdapter.fromConfig({ mpcContract });
}
