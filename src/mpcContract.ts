import { Contract, Account } from "near-api-js";
import { Address, Hex, Signature } from "viem";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "./utils/kdf";
import { TGAS, ONE_YOCTO } from "./chains/near";
import { MPCSignature, FunctionCallTransaction, SignArgs } from "./types/types";

const DEFAULT_MPC_CONTRACT = "v1.signer-prod.testnet";

/// Near Contract Type for change methods
export interface ChangeMethodArgs<T> {
  /// Change method function agruments.
  args: T;
  /// GasLimit on transaction execution.
  gas: string;
  /// Account Signing the call
  signerAccount: Account;
  /// attachedDeposit (i.e. payable amount) to attach to transaction.
  amount: string;
}

interface MultichainContractInterface extends Contract {
  // Define the signature for the `public_key` view method
  public_key: () => Promise<string>;

  // Define the signature for the `sign` change method
  sign: (
    args: ChangeMethodArgs<{ request: SignArgs }>
  ) => Promise<MPCSignature>;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class MultichainContract {
  contract: MultichainContractInterface;
  connectedAccount: Account;

  constructor(account: Account, contractId: string = DEFAULT_MPC_CONTRACT) {
    this.connectedAccount = account;

    this.contract = new Contract(account.connection, contractId, {
      changeMethods: ["sign"],
      viewMethods: ["public_key"],
      useLocalViewExecution: false,
    }) as MultichainContractInterface;
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

  requestSignature = async (
    signArgs: SignArgs,
    gas?: bigint
  ): Promise<Signature> => {
    const { big_r, s, recovery_id } = await this.contract.sign({
      signerAccount: this.connectedAccount,
      args: { request: signArgs },
      gas: gasOrDefault(gas),
      amount: ONE_YOCTO,
    });

    const signature = {
      r: `0x${big_r.affine_point.substring(2)}` as Hex,
      s: `0x${s.scalar}` as Hex,
      yParity: recovery_id,
    };
    return signature;
  };

  encodeSignatureRequestTx(
    signArgs: SignArgs,
    gas?: bigint
  ): FunctionCallTransaction<{ request: SignArgs }> {
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
            deposit: ONE_YOCTO,
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
