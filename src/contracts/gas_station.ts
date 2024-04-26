import { Contract, Account } from "near-api-js";
import { NO_DEPOSIT, TGAS, nearAccountFromEnv } from "../chains/near";
import { ChangeMethodArgs } from "../types";
import BN from "bn.js";

interface GetPaymasterArgs {
  chain_id: string;
}

interface PaymasterConfiguration {
  nonce: number;
  token_id: string;
  foreign_address: string;
  minimum_available_balance: bigint;
}

interface SetPaymasterNonceArgs {
  chain_id: string;
  token_id: string;
  nonce: number;
}

interface CreateTxArgs {
  transaction_rlp_hex: string;
  use_paymaster: boolean;
  token_id: string;
}

interface SignNextArgs {
  id: string;
}

interface TransactionSequenceCreation {
  id: bigint;
  pending_signature_count: number;
}

interface GasStationInterface extends Contract {
  // TODO - determine return types...
  get_paymasters: (
    args: ChangeMethodArgs<GetPaymasterArgs>
  ) => Promise<PaymasterConfiguration[]>;
  set_paymaster_nonce: (
    args: ChangeMethodArgs<SetPaymasterNonceArgs>
  ) => Promise<void>;
  create_transaction: (
    args: ChangeMethodArgs<CreateTxArgs>
  ) => Promise<TransactionSequenceCreation>;
  /// This returns some deep nested Promise Type...
  sign_next: (args: ChangeMethodArgs<SignNextArgs>) => Promise<void>;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class GasStationContract {
  contract: GasStationInterface;

  constructor(account: Account, contractId: string) {
    this.contract = new Contract(account, contractId, {
      changeMethods: [
        "get_paymasters",
        "set_paymaster_nonce",
        "create_transaction",
        "sign_next",
      ],
      viewMethods: [],
      useLocalViewExecution: false,
    }) as GasStationInterface;
  }

  static async fromEnv(): Promise<GasStationContract> {
    const account = await nearAccountFromEnv();
    return new GasStationContract(
      account,
      process.env.NEAR_MULTICHAIN_CONTRACT!
    );
  }

  async get_paymasters(
    args: GetPaymasterArgs,
    gas?: BN
  ): Promise<PaymasterConfiguration[]> {
    const paymasters = await this.contract.get_paymasters({
      args,
      gas: gas || TGAS.muln(100),
      attachedDeposit: NO_DEPOSIT,
    });
    return paymasters;
  }

  async set_paymaster_nonce(
    args: SetPaymasterNonceArgs,
    gas?: BN
  ): Promise<void> {
    this.contract.set_paymaster_nonce({
      args,
      gas: gas || TGAS.muln(100),
      attachedDeposit: NO_DEPOSIT,
    });
  }

  async create_transaction(
    args: CreateTxArgs,
    attachedDeposit: BN,
    gas?: BN
  ): Promise<TransactionSequenceCreation> {
    const sequence = await this.contract.create_transaction({
      args,
      gas: gas || TGAS.muln(100),
      attachedDeposit,
    });
    return sequence;
  }

  async sign_next(args: SignNextArgs, gas?: BN): Promise<void> {
    // TODO - determine return type.
    await this.contract.sign_next({
      args,
      gas: gas || TGAS.muln(100),
      attachedDeposit: NO_DEPOSIT,
    });
  }
}
