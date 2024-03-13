import { Common } from "@ethereumjs/common";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import { BN } from "bn.js";
import { providers } from "ethers";
import { providers as nearProviders } from "near-api-js";
import { functionCall } from "near-api-js/lib/transaction";
import {Web3, Bytes} from "web3";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "../utils/kdf";
import { NO_DEPOSIT, getNearAccount, provider as nearProvider } from "./near";
import { GasPriceResponse, GasPrices, TxPayload } from "../types";
import { getMultichainContract } from "../mpc_contract";
import { getFirstNonZeroGasPrice } from "../utils/gasPrice";

const config = {
  chainId: 11155111,
  providerUrl: "https://rpc.sepolia.ethpandaops.io",
  chain: "sepolia",
};

export const web3 = new Web3(config.providerUrl);
export const common = new Common({ chain: config.chain });
export const provider = new providers.JsonRpcProvider(config.providerUrl);

export const deriveEthAddress = async (derivationPath: string): Promise<string> => {
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
  const gasPrices = await res.json() as GasPriceResponse;
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

export const createPayload = async (
  sender: string,
  receiver: string,
  amount: number,
  data?: string
): Promise<TxPayload> => {
  const nonce = await web3.eth.getTransactionCount(sender);
  const { maxFeePerGas, maxPriorityFeePerGas } = await queryGasPrice();

  const transactionData = {
    nonce,
    to: receiver,
    value: BigInt(web3.utils.toWei(amount, "ether")),
    data: data || "0x",
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
  const estimatedGas = await provider.estimateGas({
    ...transactionData,
    from: sender,
  });
  console.log(`Using gas estimate of at ${estimatedGas} GWei`);
  const transactionDataWithGasLimit = {
    ...transactionData,
    gasLimit: BigInt(estimatedGas.toString()),
  };
  console.log("TxData:", transactionDataWithGasLimit);
  const transaction = FeeMarketEIP1559Transaction.fromTxData(transactionDataWithGasLimit, {
    common,
  });

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

export const requestSignature = async (payload: number[], path: string): Promise<{big_r: string, big_s: string}> => {
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

  const [big_r, big_s] = await nearProviders.getTransactionLastResult(
    transaction
  );
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
  console.log("Creating Payload for sender:", sender);
  const { transaction, payload } = await createPayload(
    sender,
    receiver,
    amount,
    data
  );

  const { big_r, big_s } = await requestSignature(
    payload,
    options?.path || "ethereum,1"
  );

  const signature = reconstructSignature(transaction, big_r, big_s, sender);
  console.log("Relaying signed tx to EVM...");
  await relayTransaction(signature);
};
