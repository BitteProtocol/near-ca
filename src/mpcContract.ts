import { Contract, Account } from "near-api-js";
import { Address, Signature } from "viem";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "./utils/kdf";
import { TGAS } from "./chains/near";
import { MPCSignature, FunctionCallTransaction, SignArgs } from "./types";
import { transformSignature } from "./utils/signature";

/**
 * Near Contract Type for change methods.
 *
 * @template T - The type of the arguments for the change method.
 * @property {T} args - Change method function arguments.
 * @property {string} gas - Gas limit on transaction execution.
 * @property {Account} signerAccount - Account signing the call.
 * @property {string} amount - Attached deposit (i.e., payable amount) to attach to the transaction.
 */
export interface ChangeMethodArgs<T> {
  args: T;
  gas: string;
  signerAccount: Account;
  amount: string;
}

interface MpcContractInterface extends Contract {
  /// Define the signature for the `public_key` view method.
  public_key: () => Promise<string>;
  /// Returns required deposit based on current request queue.
  experimental_signature_deposit: () => Promise<number>;
  /// Some clown deployed one version of the contracts with this typo
  experimantal_signature_deposit: () => Promise<number>;

  /// Define the signature for the `sign` change method.
  sign: (
    args: ChangeMethodArgs<{ request: SignArgs }>
  ) => Promise<MPCSignature>;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class MpcContract {
  contract: MpcContractInterface;
  connectedAccount: Account;

  constructor(account: Account, contractId: string) {
    this.connectedAccount = account;

    this.contract = new Contract(account.connection, contractId, {
      changeMethods: ["sign"],
      viewMethods: [
        "public_key",
        "experimental_signature_deposit",
        "experimantal_signature_deposit",
      ],
      useLocalViewExecution: false,
    }) as MpcContractInterface;
  }

  accountId(): string {
    return this.contract.contractId;
  }

  deriveEthAddress = async (derivationPath: string): Promise<Address> => {
    const rootPublicKey = await this.contract.public_key();

    const publicKey = await deriveChildPublicKey(
      najPublicKeyStrToUncompressedHexPoint(rootPublicKey),
      this.connectedAccount.accountId,
      derivationPath
    );

    return uncompressedHexPointToEvmAddress(publicKey);
  };

  getDeposit = async (): Promise<string> => {
    let deposit = 1e23;
    try {
      deposit = await this.contract.experimental_signature_deposit();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === "Contract method is not found"
      ) {
        // Clown town
        deposit = await this.contract.experimantal_signature_deposit();
      } else {
        console.warn(
          `Failed to get deposit with ${error} - using fallback of 0.1 Near`
        );
      }
    }
    return BigInt(
      deposit.toLocaleString("fullwide", { useGrouping: false })
    ).toString();
  };

  requestSignature = async (
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<Signature> => {
    const mpcSig = await this.contract.sign({
      signerAccount: this.connectedAccount,
      args: { request: signArgs },
      gas: gasOrDefault(gas),
      amount: await this.getDeposit(),
    });

    return transformSignature(mpcSig);
  };

  async encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>> {
    return {
      signerId: this.connectedAccount.accountId,
      receiverId: this.contract.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "sign",
            args: { request: signArgs },
            gas: gasOrDefault(gas),
            deposit: await this.getDeposit(),
          },
        },
      ],
    };
  }
}

function gasOrDefault(gas?: bigint): string {
  if (gas !== undefined) {
    return gas.toString();
  }
  // Default of 250 TGAS
  return (TGAS * 250n).toString();
}
