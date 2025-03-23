import { KeyPair } from "near-api-js";
import { IMpcContract } from "../mpcContract";
import {
  Address,
  Hash,
  Hex,
  Signature,
  TransactionSerializable,
  TypedDataDomain,
} from "viem";
import { NearConfig } from "near-api-js/lib/near";

/**
 * Borrowed from \@near-wallet-selector/core
 * {@link https://github.com/near/wallet-selector/blob/01081aefaa3c96ded9f83a23ecf0f210a4b64590/packages/core/src/lib/wallet/transactions.types.ts#L12}
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

/** Configuration for a NEAR account */
export interface NearAccountConfig {
  /** The key pair associated with the account */
  keyPair: KeyPair;
  /** The NEAR account ID */
  accountId: string;
  /** Network settings */
  network: NearConfig;
}

/** Base transaction structure */
export interface BaseTx {
  /** Recipient of the transaction */
  to: `0x${string}`;
  /** ETH value of the transaction */
  value?: bigint;
  /** Call data of the transaction */
  data?: `0x${string}`;
  /** Integer ID of the network for the transaction */
  chainId: number;
  /** Specified transaction nonce */
  nonce?: number;
  /** Optional gas limit */
  gas?: bigint;
}

/** Parameters for the adapter */
export interface AdapterParams {
  /** An instance of the NearMPC contract connected to the associated NEAR account */
  mpcContract: IMpcContract;
  /** Path used to generate ETH account from NEAR account (e.g., "ethereum,1") */
  derivationPath?: string;
}

/**
 * Represents a message that can be signed within an Ethereum Virtual Machine (EVM) context.
 * This can be a raw string, an EIP-712 typed data structure, or a serializable transaction.
 */
export type EvmMessage = string | EIP712TypedData | TransactionSerializable;

/** Encapsulates a signature request for an Ethereum-based message */
export interface EncodedSignRequest {
  /** The message to be signed, which could be in plain string format,
   * an EIP-712 typed data, or a serializable transaction */
  evmMessage: EvmMessage;
  /** A unique hash derived from `evmMessage` to identify the signature request */
  hashToSign: Hash;
}

/**
 * Extends the `EncodedSignRequest` for use with NEAR protocol.
 * This structure contains an additional payload to facilitate transaction signing in NEAR.
 */
export interface NearEncodedSignRequest extends EncodedSignRequest {
  /** A NEAR-specific transaction payload, typically including a request with arguments
   * for the function call */
  nearPayload: FunctionCallTransaction<{
    request: SignArgs;
  }>;
}

/**
 * Arguments required for signature request from MPC Contract.
 * {@link https://github.com/near/mpc/blob/48a572baab5904afe3cd62bd0da5a036db3a34b6/chain-signatures/contract/src/primitives.rs#L268}
 */
export interface SignArgs {
  /** Derivation path for ETH account associated with NEAR AccountId */
  path: string;
  /** Serialized Ethereum transaction bytes */
  payload: number[];
  /** Version number associated with derived ETH address (must be increasing) */
  key_version: number;
}

/** Represents the payload for a transaction */
export interface TxPayload {
  /** Serialized Ethereum transaction */
  transaction: Hex;
  /** Arguments required by NEAR MPC Contract signature request */
  signArgs: SignArgs;
}

/** Represents a function call transaction */
export interface FunctionCallTransaction<T> {
  /** Signer of the function call */
  signerId: string;
  /** Transaction recipient (a NEAR ContractId) */
  receiverId: string;
  /** Function call actions */
  actions: Array<FunctionCallAction<T>>;
}

/**
 * Result Type of MPC contract signature request.
 * Representing Affine Points on elliptic curve.
 * Example:
 * ```json
 * {
 *   "big_r": {
 *     "affine_point": "031F2CE94AF69DF45EC96D146DB2F6D35B8743FA2E21D2450070C5C339A4CD418B"
 *   },
 *   "s": {
 *     "scalar": "5AE93A7C4138972B3FE8AEA1638190905C6DB5437BDE7274BEBFA41DDAF7E4F6"
 *   },
 *   "recovery_id": 0
 * }
 * ```
 */
export interface MPCSignature {
  /** The R point of the signature */
  big_r: { affine_point: string };
  /** The S value of the signature */
  s: { scalar: string };
  /** The recovery ID */
  recovery_id: number;
}

export interface TypedDataTypes {
  name: string;
  type: string;
}

export type TypedMessageTypes = {
  [key: string]: TypedDataTypes[];
};

/** Represents the data for a typed message */
export type EIP712TypedData = {
  /** The domain of the message */
  domain: TypedDataDomain;
  /** The types of the message */
  types: TypedMessageTypes;
  /** The message itself */
  message: Record<string, unknown>;
  /** The primary type of the message */
  primaryType: string;
};

/** Sufficient data required to construct a signed Ethereum Transaction */
export interface TransactionWithSignature {
  /** Unsigned Ethereum transaction data */
  transaction: Hex;
  /** Representation of the transaction's signature */
  signature: Signature;
}

/** Interface representing the parameters required for an Ethereum transaction */
export interface EthTransactionParams {
  /** The sender's Ethereum address in hexadecimal format */
  from: Hex;
  /** The recipient's Ethereum address in hexadecimal format */
  to: Hex;
  /** Optional gas limit for the transaction in hexadecimal format */
  gas?: Hex;
  /** Optional amount of Ether to send in hexadecimal format */
  value?: Hex;
  /** Optional data payload for the transaction in hexadecimal format, often used for contract interactions */
  data?: Hex;
}

/**
 * Parameters for a personal_sign request
 * Tuple of [message: Hex, signer: Address]
 */
export type PersonalSignParams = [Hex, Address];

/**
 * Parameters for an eth_sign request
 * Tuple of [signer: Address, message: Hex]
 */
export type EthSignParams = [Address, Hex];

/**
 * Parameters for signing complex structured data (like EIP-712)
 * Tuple of [signer: Hex, structuredData: string]
 */
export type TypedDataParams = [Hex, string];

/** Type representing the possible request parameters for a signing session */
export type SessionRequestParams =
  | EthTransactionParams[]
  | Hex
  | PersonalSignParams
  | EthSignParams
  | TypedDataParams;

/** An array of supported signing methods */
export const signMethods = [
  "eth_sign",
  "personal_sign",
  "eth_sendTransaction",
  "eth_signTypedData",
  "eth_signTypedData_v4",
] as const;

/** Type representing one of the supported signing methods */
export type SignMethod = (typeof signMethods)[number];

/** Interface representing the data required for a signature request */
export type SignRequestData = {
  /** The signing method to be used */
  method: SignMethod;
  /** The ID of the Ethereum chain where the transaction or signing is taking place */
  chainId: number;
  /** The parameters required for the signing request, which vary depending on the method */
  params: SessionRequestParams;
};
/** Template literal type for NEAR key pair strings */
export type KeyPairString = `ed25519:${string}` | `secp256k1:${string}`;

/**
 * Configuration for setting up the adapter
 */
export interface SetupConfig {
  /** The NEAR account ID */
  accountId: string;
  /** The MPC contract ID */
  mpcContractId: string;
  /** The NEAR network configuration */
  network?: NearConfig;
  /** The private key for the account */
  privateKey?: string;
  /** The derivation path for the Ethereum account. Defaults to "ethereum,1" */
  derivationPath?: string;
  /** The root public key for the account. If not available it will be fetched from the MPC contract */
  rootPublicKey?: string;
}
