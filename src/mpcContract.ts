import { Contract, Account, transactions } from "near-api-js";
import { Address, Signature } from "viem";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "./utils/kdf";
import { TGAS } from "./chains/near";
import { MPCSignature, FunctionCallTransaction, SignArgs } from "./types";
import { signaturesFromOutcome } from "./utils/signature";
import { FinalExecutionOutcome } from "near-api-js/lib/providers";

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
export class MpcContract implements IMpcContract {
  rootPublicKey: string | undefined;
  contract: MpcContractInterface;
  connectedAccount: Account;

  constructor(account: Account, contractId: string, rootPublicKey?: string) {
    this.connectedAccount = account;
    this.rootPublicKey = rootPublicKey;

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
    // near-api-js SUX so bad we can't configure this RPC timeout.
    // const mpcSig = await this.contract.sign({
    //   signerAccount: this.connectedAccount,
    //   args: { request: signArgs },
    //   gas: gasOrDefault(gas),
    //   amount: await this.getDeposit(),
    // });
    const transaction = await this.encodeSignatureRequestTx(signArgs, gas);
    const outcome = await this.signAndSendSignRequest(transaction);
    // signaturesFromOutcome guarantees non empty array > 0.
    return signaturesFromOutcome(outcome)[0]!;
  };

  requestMulti = async (
    signArgs: SignArgs[],
    gas?: bigint
  ): Promise<Signature[]> => {
    const transaction = await this.encodeMulti(signArgs, gas);
    const result = await this.signAndSendSignRequest(transaction);
    return signaturesFromOutcome(result);
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

  async encodeMulti(
    signArgs: SignArgs[],
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>> {
    const deposit = await this.getDeposit();
    // TODO: This is a hack to prevent out of gas errors
    const maxGasPerAction = (gas || 300000000000000n) / BigInt(signArgs.length);
    return {
      signerId: this.connectedAccount.accountId,
      receiverId: this.contract.contractId,
      actions: signArgs.map((args) => {
        return {
          type: "FunctionCall",
          params: {
            methodName: "sign",
            args: {
              request: args,
            },
            gas: maxGasPerAction.toString(),
            deposit,
          },
        };
      }),
    };
  }

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
      // Sleep 1 second before next ping.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // txStatus times out when waiting for 'EXECUTED'.
      // Instead we wait for an earlier status type, sleep between and keep pinging.
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

function gasOrDefault(gas?: bigint): string {
  if (gas !== undefined) {
    return gas.toString();
  }
  // Default of 250 TGAS
  return (TGAS * 250n).toString();
}

export interface IMpcContract {
  connectedAccount: Account;
  accountId(): string;
  deriveEthAddress(derivationPath: string): Promise<Address>;
  getDeposit(): Promise<string>;
  requestSignature(signArgs: SignArgs, gas?: bigint): Promise<Signature>;
  requestMulti(signArgs: SignArgs[], gas?: bigint): Promise<Signature[]>;
  encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>>;
  encodeMulti(
    signArgs: SignArgs[],
    gas?: bigint
  ): Promise<FunctionCallTransaction<{ request: SignArgs }>>;
}
