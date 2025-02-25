import { Action, functionCall } from "near-api-js/lib/transaction";
import { FunctionCallAction } from "./interfaces";

/**
 * Converts a FunctionCallTransaction to an array of Action.
 *
 * @typeParam T - The type of the function call action arguments
 * @param action - The function call transaction to convert
 * @returns An array of Action objects
 */
export function convertToAction<T>(action: FunctionCallAction<T>): Action {
  return functionCall(
    action.params.methodName,
    convertToCompatibleFormat(action.params.args),
    BigInt(action.params.gas),
    BigInt(action.params.deposit)
  );
}

/**
 * Converts a structure `T` into `object | Uint8Array`
 *
 * @typeParam T - The type of the input structure
 * @param input - The input structure to convert
 * @returns The converted result as either an object or Uint8Array
 * @throws Error if conversion fails
 */
export function convertToCompatibleFormat<T>(input: T): object | Uint8Array {
  try {
    // Check if the input is already an object
    if (typeof input === "object" && input !== null) {
      return input; // Return the object as is
    }

    // Serialize to JSON and then to a Uint8Array
    const jsonString = JSON.stringify(input);
    return new TextEncoder().encode(jsonString);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert the input: ${message}`);
  }
}
