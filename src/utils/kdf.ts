import { base_decode } from "near-api-js/lib/utils/serialize";
import { ec as EC } from "elliptic";
import { Address, keccak256 } from "viem";
import { sha3_256 } from "js-sha3";

/**
 * Converts a NEAR account public key string to an uncompressed hex point
 *
 * @param najPublicKeyStr - The NEAR account public key string
 * @returns Uncompressed hex point string prefixed with "04"
 */
export function najPublicKeyStrToUncompressedHexPoint(
  najPublicKeyStr: string
): string {
  const decodedKey = base_decode(najPublicKeyStr.split(":")[1]!);
  return "04" + Buffer.from(decodedKey).toString("hex");
}

/**
 * Derives a child public key using elliptic curve operations
 *
 * @param parentUncompressedPublicKeyHex - Parent public key as uncompressed hex
 * @param signerId - The signer's identifier
 * @param path - Optional derivation path (defaults to empty string)
 * @returns Derived child public key as uncompressed hex string
 */
export function deriveChildPublicKey(
  parentUncompressedPublicKeyHex: string,
  signerId: string,
  path: string = ""
): string {
  const ec = new EC("secp256k1");
  const scalarHex = sha3_256(
    `near-mpc-recovery v0.1.0 epsilon derivation:${signerId},${path}`
  );

  const x = parentUncompressedPublicKeyHex.substring(2, 66);
  const y = parentUncompressedPublicKeyHex.substring(66);

  // Create a point object from X and Y coordinates
  const oldPublicKeyPoint = ec.curve.point(x, y);

  // Multiply the scalar by the generator point G
  const scalarTimesG = ec.g.mul(scalarHex);

  // Add the result to the old public key point
  const newPublicKeyPoint = oldPublicKeyPoint.add(scalarTimesG);
  const newX = newPublicKeyPoint.getX().toString("hex").padStart(64, "0");
  const newY = newPublicKeyPoint.getY().toString("hex").padStart(64, "0");
  return "04" + newX + newY;
}

/**
 * Converts an uncompressed hex point to an Ethereum address
 *
 * @param uncompressedHexPoint - The uncompressed hex point string
 * @returns Ethereum address derived from the public key
 * @remarks Takes the last 20 bytes of the keccak256 hash of the public key
 */
export function uncompressedHexPointToEvmAddress(
  uncompressedHexPoint: string
): Address {
  const addressHash = keccak256(`0x${uncompressedHexPoint.slice(2)}`);
  // Ethereum address is last 20 bytes of hash (40 characters), prefixed with 0x
  return ("0x" + addressHash.substring(addressHash.length - 40)) as Address;
}
