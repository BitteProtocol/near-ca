import { base_decode } from "near-api-js/lib/utils/serialize";
import { ec as EC } from "elliptic";
import BN from "bn.js";
import keccak from "keccak";
import hash from "hash.js";
import bs58check from "bs58check";

export const najPublicKeyStrToUncompressedHexPoint = (
  najPublicKeyStr: string
) => {
  return (
    "04" +
    Buffer.from(base_decode(najPublicKeyStr.split(":")[1])).toString("hex")
  );
};

const sha256Hash = async (str: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = [...new Uint8Array(hashBuffer)];
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const sha256StringToScalarLittleEndian = (hashString: string) => {
  const littleEndianString = hashString.match(/../g)!.reverse().join("");

  const scalar = new BN(littleEndianString, 16);

  return scalar;
};

export const deriveChildPublicKey = async (
  parentUncompressedPublicKeyHex: string,
  signerId: string,
  path = ""
) => {
  const ec = new EC("secp256k1");
  let scalar: string = await sha256Hash(
    `near-mpc-recovery v0.1.0 epsilon derivation:${signerId},${path}`
  );

  const scalarBN = sha256StringToScalarLittleEndian(scalar);

  const x = parentUncompressedPublicKeyHex.substring(2, 66);
  const y = parentUncompressedPublicKeyHex.substring(66);

  // Create a point object from X and Y coordinates
  const oldPublicKeyPoint = ec.curve.point(x, y);

  // Multiply the scalar by the generator point G
  const scalarTimesG = ec.g.mul(scalarBN);

  // Add the result to the old public key point
  const newPublicKeyPoint = oldPublicKeyPoint.add(scalarTimesG);

  return (
    "04" +
    (newPublicKeyPoint.getX().toString("hex").padStart(64, "0") +
      newPublicKeyPoint.getY().toString("hex").padStart(64, "0"))
  );
};

export const uncompressedHexPointToEvmAddress = (
  uncompressedHexPoint: string
) => {
  const address = keccak("keccak256")
    .update(Buffer.from(uncompressedHexPoint.substring(2), "hex"))
    .digest("hex");

  // Ethereum address is last 20 bytes of hash (40 characters), prefixed with 0x
  return "0x" + address.substring(address.length - 40);
};
