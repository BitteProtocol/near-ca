import { MpcContract } from "./mpcContract";
import { Hex, SignableMessage, Signature, TransactionSerializable } from "viem";

/**
 * Borrowed from @near-wallet-selector/core
 * https://github.com/near/wallet-selector/blob/01081aefaa3c96ded9f83a23ecf0d210a4b64590/packages/core/src/lib/wallet/transactions.types.ts#L12
 */
export interface FunctionCallAction<T> {
  type: "FunctionCall";
  params: {
    methodName: string;
    args: T;
    gas: string;
    deposit: string;
  };
}

/**
 * Represents the base transaction structure.
 *
 * @property {`0x${string}`} to - Recipient of the transaction.
 * @property {bigint} [value] - ETH value of the transaction.
 * @property {`0x${string}`} data - Call data of the transaction.
 * @property {number} chainId - Integer ID of the network for the transaction.
 * @property {number} [nonce] - Specified transaction nonce.
 * @property {bigint} [gas] - Optional gas limit.
 */
export interface BaseTx {
  to: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  chainId: number;
  nonce?: number;
  gas?: bigint;
}

/**
 * Parameters for the adapter.
 *
 * @property {MpcContract} mpcContract - An instance of the NearMPC contract connected to the associated NEAR account.
 * @property {string} [derivationPath] - Path used to generate ETH account from NEAR account (e.g., "ethereum,1").
 */
export interface AdapterParams {
  mpcContract: MpcContract;
  derivationPath?: string;
}

/**
 * Represents the data required for a NEAR to Ethereum transaction.
 *
 * @property {string | TransactionSerializable} evmMessage - The EVM message or transaction.
 * @property {FunctionCallTransaction<{ request: SignArgs }>} nearPayload - The NEAR payload containing the function call transaction.
 * @property {RecoveryData} recoveryData - The data required to recover partial signature.
 */
export interface NearEthTxData {
  evmMessage: string | TransactionSerializable;
  nearPayload: FunctionCallTransaction<{ request: SignArgs }>;
  recoveryData: RecoveryData;
}

/**
 * Represents the gas fees for an Ethereum transaction.
 *
 * @property {bigint} maxFeePerGas - The maximum fee per gas unit.
 * @property {bigint} maxPriorityFeePerGas - The maximum priority fee per gas unit.
 */
export interface GasFees {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/**
 * Arguments required for signature request from MPC Contract.
 * cf. https://github.com/near/mpc/blob/48a572baab5904afe3cd62bd0da5a036db3a34b6/chain-signatures/contract/src/primitives.rs#L268
 *
 * @property {string} path - Derivation path for ETH account associated with NEAR AccountId.
 * @property {number[]} payload - Serialized Ethereum transaction bytes.
 * @property {number} key_version - Version number associated with derived ETH address (must be increasing).
 */
export interface SignArgs {
  path: string;
  payload: number[];
  key_version: number;
}

/**
 * Represents the payload for a transaction.
 *
 * @property {Hex} transaction - Serialized Ethereum transaction.
 * @property {SignArgs} signArgs - Arguments required by NEAR MPC Contract signature request.
 */
export interface TxPayload {
  transaction: Hex;
  signArgs: SignArgs;
}

/**
 * Represents a function call transaction.
 *
 * @template T - The type of the function call action arguments.
 * @property {string} signerId - Signer of the function call.
 * @property {string} receiverId - Transaction recipient (a NEAR ContractId).
 * @property {Array<FunctionCallAction<T>>} actions - Function call actions.
 */
export interface FunctionCallTransaction<T> {
  signerId: string;
  receiverId: string;
  actions: Array<FunctionCallAction<T>>;
}

/**
 * Result Type of MPC contract signature request.
 * Representing Affine Points on eliptic curve.
 * Example: {
    "big_r": {
      "affine_point": "031F2CE94AF69DF45EC96D146DB2F6D35B8743FA2E21D2450070C5C339A4CD418B"
    },
    "s": { "scalar": "5AE93A7C4138972B3FE8AEA1638190905C6DB5437BDE7274BEBFA41DDAF7E4F6"
    },
    "recovery_id": 0
  }
 */

export interface MPCSignature {
  big_r: { affine_point: string };
  s: { scalar: string };
  recovery_id: number;
}

/**
 * Represents the data for a message.
 *
 * @property {Hex} address - The address associated with the message.
 * @property {SignableMessage} message - The signable message.
 */
export interface MessageData {
  address: Hex;
  message: SignableMessage;
}

/**
 * Represents the data for a typed message.
 *
 * @property {Hex} address - The address associated with the message.
 * @property {any} types - The types of the message.
 * @property {any} primaryType - The primary type of the message.
 * @property {any} message - The message itself.
 * @property {any} domain - The domain of the message.
 */
export interface TypedMessageData {
  address: Hex;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  types: any;
  primaryType: any;
  message: any;
  domain: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Represents the recovery data.
 *
 * @property {string} type - The type of the recovery data.
 * @property {MessageData | TypedMessageData | Hex} data - The recovery data.
 */
export interface RecoveryData {
  // TODO use enum!
  type: string;
  data: MessageData | TypedMessageData | Hex;
}

/**
 * Sufficient data required to construct a signed Ethereum Transaction.
 *
 * @property {Hex} transaction - Unsigned Ethereum transaction data.
 * @property {Signature} signature - Representation of the transaction's signature.
 */
export interface TransactionWithSignature {
  transaction: Hex;
  signature: Signature;
}
