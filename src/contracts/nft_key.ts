import { Contract, Account } from "near-api-js";
import { NO_DEPOSIT, TGAS, nearAccountFromEnv } from "../chains/near";
import { ChangeMethodArgs } from "../types";
import BN from "bn.js";

interface CktApproveArgs {
  token_id: bigint;
  account_id: string;
  msg: string;
}

interface NftKeyInterface extends Contract {
  // TODO - determine return types...
  storage_deposit: (args: ChangeMethodArgs<object>) => Promise<void>;
  mint: (args: ChangeMethodArgs<object>) => Promise<void>;
  ckt_approve: (args: ChangeMethodArgs<CktApproveArgs>) => Promise<void>;
}

/**
 * High-level interface for the Near MPC-Recovery Contract
 * located in: https://github.com/near/mpc-recovery
 */
export class NftKeyContract {
  contract: NftKeyInterface;

  constructor(account: Account, contractId: string) {
    this.contract = new Contract(account, contractId, {
      changeMethods: ["storage_deposit", "mint", "ckt_approve"],
      viewMethods: [],
      useLocalViewExecution: false,
    }) as NftKeyInterface;
  }

  static async fromEnv(): Promise<NftKeyContract> {
    const account = await nearAccountFromEnv();
    return new NftKeyContract(account, process.env.NEAR_MULTICHAIN_CONTRACT!);
  }

  async storage_deposit(attachedDeposit: bigint, gas?: BN): Promise<void> {
    await this.contract.storage_deposit({
      args: {},
      gas: gas || TGAS.muln(100),
      attachedDeposit: new BN(attachedDeposit.toString()),
    });
  }

  async mint(gas?: BN): Promise<void> {
    await this.contract.mint({
      args: {},
      gas: gas || TGAS.muln(100),
      attachedDeposit: NO_DEPOSIT,
    });
  }

  async ckt_approve(args: CktApproveArgs, gas?: BN): Promise<void> {
    await this.contract.mint({
      args,
      gas: gas || TGAS.muln(100),
      attachedDeposit: NO_DEPOSIT,
    });
  }
}
