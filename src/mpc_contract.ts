import { Contract, Account } from "near-api-js";

interface MultichainContract extends Contract {
  // Define the signature for the `public_key` view method
  public_key: () => Promise<string>;

  // Define the signature for the `sign` change method
  // The exact parameters and return type will depend on how the method is defined in your smart contract
  sign: (args: SignArgs) => Promise<SignResult>;
}

// Assuming you have some arguments for the `sign` method, define them here
interface SignArgs {
  // Example argument - adjust according to your actual contract method's parameters
  message: string;
}

// Assuming the `sign` method returns something specific, define that structure here
interface SignResult {
  // Example return structure - adjust according to your actual contract method's return type
  signature: string;
}

export function getMultichainContract(account: Account): MultichainContract {
  return new Contract(account, process.env.NEAR_MULTICHAIN_CONTRACT!, {
    changeMethods: ["sign"],
    viewMethods: ["public_key"],
    useLocalViewExecution: false,
  }) as MultichainContract;
}
