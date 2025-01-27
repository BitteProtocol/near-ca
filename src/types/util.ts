import { Action, functionCall } from "near-api-js/lib/transaction";
import { FunctionCallAction } from "./interfaces";

/**
 * Converts a FunctionCallTransaction to an array of Action.
 *
 * @template T - The type of the function call action arguments.
 * @param {FunctionCallTransaction<T>} transaction - The function call transaction to convert.
 * @returns {Action[]} - An array of Action objects.
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
 * Converts a structure `T` into `object | Uint8Array`.
 *
 * @param {T} input - The input structure to convert.
 * @returns {object | Uint8Array} - The converted result.
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
    throw new Error(`Failed to convert the input ${message}`);
  }
}
