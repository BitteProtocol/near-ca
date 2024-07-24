import { base_decode } from "near-api-js/lib/utils/serialize";
import { ec as EC } from "elliptic";
import { Address, keccak256 } from "viem";
import { createHash } from "crypto";

const EPSILON_DERIVATION_PREFIX = "near-mpc-recovery v0.1.0 epsilon derivation";
const secp256k1 = new EC("secp256k1");

class Scalar {
  static fromBytes(bytes: Buffer): EC.KeyPair | null {
    try {
      return secp256k1.keyFromPrivate(bytes, "hex");
    } catch {
      return null;
    }
  }

  static fromNonBiased(hash: Buffer): EC.KeyPair {
    const scalar = this.fromBytes(hash);
    if (!scalar) {
      throw new Error("Derived epsilon value falls outside of the field");
    }
    return scalar;
  }
}

export function deriveEpsilon(predecessorId: string, path: string): number[] {
  // Construct the derivation path
  const derivationPath = `${EPSILON_DERIVATION_PREFIX}:${predecessorId},${path}`;

  // Create a SHA3-256 hash of the derivation path
  const hasher = createHash("sha3-256");
  hasher.update(derivationPath);
  const hash = hasher.digest();

  // Convert the hash to a Scalar and extract the private key
  const scalar = Scalar.fromNonBiased(hash);
  const hashBuffer = scalar.getPrivate().toArray("be", 32);
  return [...new Uint8Array(hashBuffer)];
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
  const ec = new EC("secp256k1");
  const scalarHashArray = deriveEpsilon(signerId, path);
  const scalarHex = scalarHashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

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

export function uncompressedHexPointToEvmAddress(
  uncompressedHexPoint: string
): Address {
  const addressHash = keccak256(`0x${uncompressedHexPoint.slice(2)}`);
  // Ethereum address is last 20 bytes of hash (40 characters), prefixed with 0x
  return ("0x" + addressHash.substring(addressHash.length - 40)) as Address;
}

// async function altHash(str: string): Promise<string> {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(str);
//   const hashBuffer = await crypto.subtle.digest("sha3-256", data);
//   const hashArray = [...new Uint8Array(hashBuffer)];
//   const result = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
//   return sha256StringToScalarLittleEndian(result);
// }

// function sha256StringToScalarLittleEndian(hashString: string): string {
//   // return hashString.match(/../g)!.reverse().join("");
//   return hashString.match(/../g)!.join("");
// }

// function sha3Hash(str: string): string {
//   // js-sha3: yarn add js-sha3
//   // import { sha3_256 } from "js-sha3";
//   // return sha3_256(str);

//   // crypto-js: yarn add -D @types/crypto-js && yarn add crypto-js
//   // import CryptoJS from "crypto-js";
//   // return CryptoJS.SHA3(str).toString(CryptoJS.enc.Hex);

//   // keccak: yarn add -D @types/keccak && yarn add keccak
//   // import keccak from "keccak";
//   // return keccak("keccak256").update(str).digest("hex");

//   // viem
//   const data = new TextEncoder().encode(str);
//   const bytes = keccak256(data, "bytes");
//   console.log(bytes);
//   return toHex(bytes).slice(2);
// }
