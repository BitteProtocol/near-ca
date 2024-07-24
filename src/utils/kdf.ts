import { base_decode } from "near-api-js/lib/utils/serialize";
import { ec as EC } from "elliptic";
import { Address, keccak256 } from "viem";
import { createHash } from "crypto";

const EPSILON_DERIVATION_PREFIX = "near-mpc-recovery v0.1.0 epsilon derivation";
const secp256k1 = new EC("secp256k1");

export function deriveEpsilon(predecessorId: string, path: string): string {
  const derivationPath = `${EPSILON_DERIVATION_PREFIX}:${predecessorId},${path}`;

  // Create a SHA3-256 hash of the derivation path
  const hasher = createHash("sha3-256");
  hasher.update(derivationPath);
  const hash = hasher.digest();

  // Convert the hash to a Scalar and extract the private key
  const scalar = secp256k1.keyFromPrivate(hash, "hex");
  const hashBuffer = scalar.getPrivate().toArray("be", 32);

  // Convert and return hex representation.
  return hashBuffer.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function najPublicKeyStrToUncompressedHexPoint(
  najPublicKeyStr: string
): string {
  const decodedKey = base_decode(najPublicKeyStr.split(":")[1]!);
  return "04" + Buffer.from(decodedKey).toString("hex");
}

export async function deriveChildPublicKey(
  parentUncompressedPublicKeyHex: string,
  signerId: string,
  path: string = ""
): Promise<string> {
  const scalarHex = deriveEpsilon(signerId, path);

  const x = parentUncompressedPublicKeyHex.substring(2, 66);
  const y = parentUncompressedPublicKeyHex.substring(66);

  // Create a point object from X and Y coordinates
  const oldPublicKeyPoint = secp256k1.curve.point(x, y);

  // Multiply the scalar by the generator point G
  const scalarTimesG = secp256k1.g.mul(scalarHex);

  // Add the result to the old public key point
  const newPublicKeyPoint = oldPublicKeyPoint.add(scalarTimesG);
  const newX = newPublicKeyPoint.getX().toString("hex").padStart(64, "0");
  const newY = newPublicKeyPoint.getY().toString("hex").padStart(64, "0");
  return "04" + newX + newY;
}

export function uncompressedHexPointToEvmAddress(
  uncompressedHexPoint: string
): Address {
  const addressHash = keccak256(`0x${uncompressedHexPoint.slice(2)}`);
  // Ethereum address is last 20 bytes of hash (40 characters), prefixed with 0x
  return ("0x" + addressHash.substring(addressHash.length - 40)) as Address;
}
