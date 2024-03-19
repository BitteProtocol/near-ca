import { Common } from "@ethereumjs/common";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import { BN } from "bn.js";
import { ethers } from "ethers";
import { providers as nearProviders } from "near-api-js";
import { functionCall } from "near-api-js/lib/transaction";
import { Web3, Bytes } from "web3";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "../utils/kdf";
import { NO_DEPOSIT, getNearAccount, provider as nearProvider } from "./near";
import {
  GasPriceResponse,
  GasPrices,
  MinimalTxData,
  TxPayload,
} from "../types";
import { getMultichainContract } from "../mpc_contract";
import { getFirstNonZeroGasPrice } from "../utils/gasPrice";

const config = {
  chainId: 11155111,
  // providerUrl: "https://rpc.sepolia.ethpandaops.io",
  // providerUrl: "https://sepolia.gateway.tenderly.co",
  providerUrl: "https://rpc2.sepolia.org",
  chain: "sepolia",
};

export const web3 = new Web3(config.providerUrl);
export const common = new Common({ chain: config.chain });
export const provider = new ethers.JsonRpcProvider(
  config.providerUrl,
  config.chainId
);

export const deriveEthAddress = async (
  derivationPath: string
): Promise<string> => {
  const account = await getNearAccount();
  const multichainContract = getMultichainContract(account);
  const rootPublicKey = await multichainContract.public_key();

  const publicKey = await deriveChildPublicKey(
    najPublicKeyStrToUncompressedHexPoint(rootPublicKey),
    process.env.NEAR_ACCOUNT_ID!,
    derivationPath
  );

  return uncompressedHexPointToEvmAddress(publicKey);
};

async function queryGasPrice(): Promise<GasPrices> {
  const res = await fetch(
    "https://sepolia.beaconcha.in/api/v1/execution/gasnow"
  );
  const gasPrices = (await res.json()) as GasPriceResponse;
  const maxPriorityFeePerGas = BigInt(getFirstNonZeroGasPrice(gasPrices)!);

  // Since we don't have a direct `baseFeePerGas`, we'll use a workaround.
  // Ideally, you should fetch the current `baseFeePerGas` from the network.
  // Here, we'll just set a buffer based on `maxPriorityFeePerGas` for demonstration purposes.
  // This is NOT a recommended practice for production environments.
  const buffer = BigInt(2 * 1e9); // Example buffer of 2 Gwei, assuming the API values are in WEI
  const maxFeePerGas = maxPriorityFeePerGas + buffer;
  const returnData = { maxFeePerGas, maxPriorityFeePerGas };
  console.log("Gas estimates", returnData);
  return { maxFeePerGas, maxPriorityFeePerGas };
}

async function buildEIP1559Tx(
  from: string,
  txData: MinimalTxData
): Promise<FeeMarketEIP1559Transaction> {
  const nonce = await provider.getTransactionCount(from);
  const { maxFeePerGas, maxPriorityFeePerGas } = await queryGasPrice();
  const transactionData = {
    nonce,
    to: txData.to,
    value: BigInt(txData.value),
    data: txData.data || "0x",
  };
  const estimatedGas = await provider.estimateGas({
    ...transactionData,
    from,
  });
  console.log(`Using gas estimate of at ${estimatedGas} GWei`);
  const transactionDataWithGasLimit = {
    ...transactionData,
    gasLimit: BigInt(estimatedGas.toString()),
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  console.log("TxData:", transactionDataWithGasLimit);
  return FeeMarketEIP1559Transaction.fromTxData(transactionDataWithGasLimit, {
    common,
  });
}

export const createPayload = async (
  from: string,
  txData: MinimalTxData
): Promise<TxPayload> => {
  const transaction = await buildEIP1559Tx(from, txData);
  const payload = Array.from(
    new Uint8Array(transaction.getHashedMessageToSign().slice().reverse())
  );
  return { transaction, payload };
};

export const reconstructSignature = (
  transaction: FeeMarketEIP1559Transaction,
  big_r: string,
  big_s: string,
  sender: string
): FeeMarketEIP1559Transaction => {
  const r = Buffer.from(big_r.substring(2), "hex");
  const s = Buffer.from(big_s, "hex");

  const candidates = [0n, 1n].map((v) => transaction.addSignature(v, r, s));
  const signature = candidates.find(
    (c) =>
      c.getSenderAddress().toString().toLowerCase() === sender.toLowerCase()
  );

  if (!signature) {
    throw new Error("Signature is not valid");
  }

  return signature;
};

export const relayTransaction = async (
  signedTransaction: FeeMarketEIP1559Transaction
): Promise<Bytes> => {
  const serializedTx = bytesToHex(signedTransaction.serialize());
  const relayed = await web3.eth.sendSignedTransaction(serializedTx);
  console.log("Transaction Confirmed:", relayed.transactionHash);
  return relayed.transactionHash;
};

export const requestSignature = async (
  payload: number[],
  path: string
): Promise<{ big_r: string; big_s: string }> => {
  const account = await getNearAccount();
  const multichainContract = getMultichainContract(account);
  const request = await account.signAndSendTransaction({
    receiverId: multichainContract.contractId,
    actions: [
      functionCall(
        "sign",
        { path, payload },
        new BN("300000000000000"),
        new BN(NO_DEPOSIT)
      ),
    ],
  });

  const transaction = await nearProvider.txStatus(
    request.transaction.hash,
    "unnused"
  );

  const [big_r, big_s] =
    await nearProviders.getTransactionLastResult(transaction);
  return { big_r, big_s };
};

export const signAndSendTransaction = async (
  sender: string,
  receiver: string,
  amount: number,
  data?: string,
  options?: {
    path: string;
  }
): Promise<void> => {
  const signature = await signTx(sender, receiver, amount, data, options);
  console.log("Relaying signed tx to EVM...");
  await relayTransaction(signature);
};

export const signTx = async (
  sender: string,
  receiver: string,
  amount: number,
  data?: string,
  options?: {
    path: string;
  }
): Promise<FeeMarketEIP1559Transaction> => {
  console.log("Creating Payload for sender:", sender);
  const { transaction, payload } = await createPayload(sender, {
    to: receiver,
    value: ethers.parseEther(amount.toString()),
    data,
  });

  const { big_r, big_s } = await requestSignature(
    payload,
    options?.path || "ethereum,1"
  );

  return reconstructSignature(transaction, big_r, big_s, sender);
};

export const signHashedMessage = async (
  sender: string,
  tx: MinimalTxData,
  hash: string,
  options?: {
    path: string;
  }
): Promise<FeeMarketEIP1559Transaction> => {
  console.log("Creating Payload for sender:", sender);
  const payload = Array.from(
    new Uint8Array(hexStringToByteArray(hash).slice().reverse())
  );
  const { big_r, big_s } = await requestSignature(
    payload,
    options?.path || "ethereum,1"
  );

  return reconstructSignature(
    await buildEIP1559Tx(sender, tx),
    big_r,
    big_s,
    sender
  );
};

function hexStringToByteArray(hexString: string): Uint8Array {
  // Remove any leading "0x" if present
  if (hexString.startsWith("0x")) {
    hexString = hexString.slice(2);
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
    bytes[j] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}
