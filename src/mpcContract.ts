import { Account, transactions } from "near-api-js";
import { Address, Signature } from "viem";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  signatureFromOutcome,
  uncompressedHexPointToEvmAddress,
} from "./utils";
import { TGAS } from "./chains";
import { FunctionCallTransaction, SignArgs } from "./types";
import { FinalExecutionOutcome } from "near-api-js/lib/providers";

/**
 * Near Contract Type for change methods.
 *
 * @typeParam T - The type of the arguments for the change method
 */
export interface ChangeMethodArgs<T> {
  /** Change method function arguments */
  args: T;
  /** Gas limit on transaction execution */
  gas: string;
  /** Account signing the call */
  signerAccount: Account;
  /** Attached deposit (i.e., payable amount) to attach to the transaction */
  amount: string;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class MpcContract implements IMpcContract {
  rootPublicKey: string | undefined;
  contractId: string;
  // contract: MpcContractInterface;
  connectedAccount: Account;

  /**
   * Creates a new MPC Contract instance
   *
   * @param account - The NEAR account to use
   * @param contractId - The contract ID
   * @param rootPublicKey - Optional root public key
   */
  constructor(account: Account, contractId: string, rootPublicKey?: string) {
    this.connectedAccount = account;
    this.rootPublicKey = rootPublicKey;
    this.contractId = contractId;
    // this.contract = new Contract(account, contractId, {
    //   changeMethods: ["sign"],
    //   viewMethods: ["public_key", "experimental_signature_deposit"],
    //   useLocalViewExecution: false,
    // }) as MpcContractInterface;
  }

  /**
   * Gets the contract ID
   *
   * @returns The contract ID
   */
  accountId(): string {
    return this.contractId;
  }

  /**
   * Derives an Ethereum address from a derivation path
   *
   * @param derivationPath - The path to derive the address from
   * @returns The derived Ethereum address
   */
  deriveEthAddress = async (derivationPath: string): Promise<Address> => {
    if (!this.rootPublicKey) {
      this.rootPublicKey = await this.connectedAccount.provider.callFunction(
        this.contractId,
        "public_key",
        {}
      );
    }

    const publicKey = deriveChildPublicKey(
      najPublicKeyStrToUncompressedHexPoint(this.rootPublicKey!),
      this.connectedAccount.accountId,
      derivationPath
    );

    return uncompressedHexPointToEvmAddress(publicKey);
  };

  /**
   * Requests a signature from the MPC contract
   *
   * @param signArgs - The arguments for the signature request
   * @param gas - Optional gas limit
   * @returns The signature
   */
  requestSignature = async (
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<Signature> => {
    const transaction = await this.encodeSignatureRequestTx(signArgs, gas);
    const outcome = await this.signAndSendSignRequest(transaction);
    return signatureFromOutcome(outcome);
  };

  /**
   * Encodes a signature request into a transaction
   *
   * @param signArgs - The arguments for the signature request
   * @param gas - Optional gas limit
   * @returns The encoded transaction
   */
  async encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>> {
    return {
      signerId: this.connectedAccount.accountId,
      receiverId: this.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "sign",
            args: { request: signArgs },
            gas: gasOrDefault(gas),
            deposit: "1",
          },
        },
      ],
    };
  }

  /**
   * Signs and sends a signature request
   *
   * @param transaction - The transaction to sign and send
   * @param blockTimeout - Optional timeout in blocks
   * @returns The execution outcome
   */
  async signAndSendSignRequest(
    transaction: FunctionCallTransaction<{ request: SignArgs }>
  ): Promise<FinalExecutionOutcome> {
    const account = this.connectedAccount;
    const signedTx = await account.createSignedTransaction(
      this.contractId,
      transaction.actions.map(({ params: { args, gas, deposit } }) =>
        transactions.functionCall("sign", args, BigInt(gas), BigInt(deposit))
      )
    );
    return account.provider.sendTransactionUntil(signedTx, "EXECUTED");
  }
}

/**
 * Returns the gas value or a default if not provided
 *
 * @param gas - Optional gas value
 * @returns The gas value as a string
 */
function gasOrDefault(gas?: bigint): string {
  if (gas !== undefined) {
    return gas.toString();
  }
  return (TGAS * 250n).toString();
}

/** Interface for MPC Contract implementation */
export interface IMpcContract {
  connectedAccount: Account;
  accountId(): string;
  deriveEthAddress(derivationPath: string): Promise<Address>;
  requestSignature(signArgs: SignArgs, gas?: bigint): Promise<Signature>;
  encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>>;
}
