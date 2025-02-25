import { Contract, Account, transactions } from "near-api-js";
import { Address, Signature } from "viem";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "./utils/kdf";
import { TGAS } from "./chains/near";
import { MPCSignature, FunctionCallTransaction, SignArgs } from "./types";
import { signatureFromOutcome } from "./utils/signature";
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

/** Interface extending the base NEAR Contract with MPC-specific methods */
interface MpcContractInterface extends Contract {
  /** Returns the public key */
  public_key: () => Promise<string>;
  /** Returns required deposit based on current request queue */
  experimental_signature_deposit: () => Promise<number>;
  /** Signs a request using the MPC contract */
  sign: (
    args: ChangeMethodArgs<{ request: SignArgs }>
  ) => Promise<MPCSignature>;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class MpcContract implements IMpcContract {
  rootPublicKey: string | undefined;
  contract: MpcContractInterface;
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

    this.contract = new Contract(account.connection, contractId, {
      changeMethods: ["sign"],
      viewMethods: ["public_key", "experimental_signature_deposit"],
      useLocalViewExecution: false,
    }) as MpcContractInterface;
  }

  /**
   * Gets the contract ID
   *
   * @returns The contract ID
   */
  accountId(): string {
    return this.contract.contractId;
  }

  /**
   * Derives an Ethereum address from a derivation path
   *
   * @param derivationPath - The path to derive the address from
   * @returns The derived Ethereum address
   */
  deriveEthAddress = async (derivationPath: string): Promise<Address> => {
    if (!this.rootPublicKey) {
      this.rootPublicKey = await this.contract.public_key();
    }

    const publicKey = deriveChildPublicKey(
      najPublicKeyStrToUncompressedHexPoint(this.rootPublicKey),
      this.connectedAccount.accountId,
      derivationPath
    );

    return uncompressedHexPointToEvmAddress(publicKey);
  };

  /**
   * Gets the required deposit for the signature
   *
   * @returns The required deposit amount as a string
   */
  getDeposit = async (): Promise<string> => {
    const deposit = await this.contract.experimental_signature_deposit();
    return BigInt(
      deposit.toLocaleString("fullwide", { useGrouping: false })
    ).toString();
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

  /**
   * Signs and sends a signature request
   *
   * @param transaction - The transaction to sign and send
   * @param blockTimeout - Optional timeout in blocks
   * @returns The execution outcome
   */
  async signAndSendSignRequest(
    transaction: FunctionCallTransaction<{ request: SignArgs }>,
    blockTimeout: number = 30
  ): Promise<FinalExecutionOutcome> {
    const account = this.connectedAccount;
    // @ts-expect-error: Account.signTransaction is protected (for no apparantly good reason)
    const [txHash, signedTx] = await account.signTransaction(
      this.contract.contractId,
      transaction.actions.map(({ params: { args, gas, deposit } }) =>
        transactions.functionCall("sign", args, BigInt(gas), BigInt(deposit))
      )
    );
    const provider = account.connection.provider;
    let outcome = await provider.sendTransactionAsync(signedTx);

    let pings = 0;
    while (
      outcome.final_execution_status != "EXECUTED" &&
      pings < blockTimeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      outcome = await provider.txStatus(txHash, account.accountId, "INCLUDED");
      pings += 1;
    }
    if (pings >= blockTimeout) {
      console.warn(
        `Request status polling exited before desired outcome.\n  Current status: ${outcome.final_execution_status}\nSignature Request will likley fail.`
      );
    }
    return outcome;
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
  getDeposit(): Promise<string>;
  requestSignature(signArgs: SignArgs, gas?: bigint): Promise<Signature>;
  encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>>;
}
