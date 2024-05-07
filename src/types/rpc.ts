// Basic structure of the JSON-RPC response
export interface JSONRPCResponse {
  jsonrpc: string;
  result: Result;
  id: string;
}

// Result contains various fields like final execution status, an array of receipts, etc.
export interface Result {
  final_execution_status: string;
  receipts: Receipt[];
  receipts_outcome: ReceiptOutcome[];
  status: TransactionStatus;
  transaction: Transaction;
  transaction_outcome: TransactionOutcome;
}

// Define Receipt type with its structure
interface Receipt {
  predecessor_id: string;
  receipt: ReceiptDetail;
  receipt_id: string;
  receiver_id: string;
}

// Detailed structure of a receipt which includes actions and other properties
interface ReceiptDetail {
  Action: ActionDetail;
}

// Actions within the receipt
interface ActionDetail {
  actions: Action[];
  gas_price: string;
  // TODO - determine types here and find a non-trivial example.
  //  cf: https://github.com/Mintbase/near-ca/issues/31
  // input_data_ids: any[];
  // output_data_receivers: any[];
  signer_id: string;
  signer_public_key: string;
}

// Action can have different types like FunctionCall or Transfer
interface Action {
  FunctionCall?: FunctionCall;
  Transfer?: Transfer;
}

// FunctionCall action specifics
interface FunctionCall {
  args: string;
  deposit: string;
  gas: number;
  method_name: string;
}

// Transfer action specifics
interface Transfer {
  deposit: string;
}

// Receipt outcomes are listed in an array
export interface ReceiptOutcome {
  block_hash: string;
  id: string;
  outcome: Outcome;
  proof: Proof[];
}

// Outcome of executing the action
interface Outcome {
  executor_id: string;
  gas_burnt: number;
  logs: string[];
  metadata: Metadata;
  receipt_ids: string[];
  status: OutcomeStatus;
  tokens_burnt: string;
}

// Metadata may contain various gas profiling information
interface Metadata {
  gas_profile: GasProfile[];
  version: number;
}

// Detailed gas usage per action or computation step
interface GasProfile {
  cost: string;
  cost_category: string;
  gas_used: number;
}

// Status of the outcome, success or failure specifics
interface OutcomeStatus {
  SuccessReceiptId?: string;
  SuccessValue?: string;
}

// Proofs for the transaction validation
interface Proof {
  direction: string;
  hash: string;
}

// Status field detailing the transaction execution result
interface TransactionStatus {
  SuccessValue: string;
}

// Transaction detail structure
interface Transaction {
  actions: TransactionAction[];
  hash: string;
  nonce: number;
  public_key: string;
  receiver_id: string;
  signature: string;
  signer_id: string;
}

// Actions within a transaction
interface TransactionAction {
  FunctionCall: FunctionCall;
}

// Transaction outcome mirrors structure similar to receipt outcomes
interface TransactionOutcome {
  block_hash: string;
  id: string;
  outcome: Outcome;
  proof: Proof[];
}
