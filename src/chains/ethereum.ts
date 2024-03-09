import { Common } from "@ethereumjs/common";
import { FeeMarketEIP1559Transaction } from "@ethereumjs/tx";
import { bytesToHex } from "@ethereumjs/util";
import { BN } from "bn.js";
import { providers } from "ethers";
import { Contract, providers as nearProviders } from "near-api-js";
import { functionCall } from "near-api-js/lib/transaction";
import Web3 from "web3";
import {
  deriveChildPublicKey,
  najPublicKeyStrToUncompressedHexPoint,
  uncompressedHexPointToEvmAddress,
} from "../utils/kdf";
import { NO_DEPOSIT, getNearAccount, provider as nearProvider } from "./near";

const config = {
  chainId: 11155111,
  providerUrl: "https://rpc.sepolia.ethpandaops.io",
  chain: "sepolia",
};

export const web3 = new Web3(config.providerUrl);
export const common = new Common({ chain: config.chain });
export const provider = new providers.JsonRpcProvider(config.providerUrl);

export const deriveEthAddress = async (derivationPath: string) => {
  const { account } = await getNearAccount();
  const multichainContract = new Contract(
    account,
    process.env.NEAR_MULTICHAIN_CONTRACT!,
    {
      changeMethods: ["sign"],
      viewMethods: ["public_key"],
      useLocalViewExecution: false,
    }
  );

  // @ts-ignore
  const rootPublicKey = await multichainContract.public_key();

  const publicKey = await deriveChildPublicKey(
    najPublicKeyStrToUncompressedHexPoint(rootPublicKey),
    process.env.NEAR_ACCOUNT_ID!,
    derivationPath
  );

  return uncompressedHexPointToEvmAddress(publicKey);
};

export const createPayload = async (
  sender: string,
  receiver: string,
  amount: number,
  data?: string
) => {
  const nonce = await web3.eth.getTransactionCount(sender);
  const feeData = await provider.getFeeData();

  const transactionData = {
    nonce,
    gasLimit: feeData.lastBaseFeePerGas?.toBigInt(),
    maxFeePerGas: feeData.maxFeePerGas?.toBigInt(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toBigInt(),
    to: receiver,
    value: BigInt(web3.utils.toWei(amount, "ether")),
    chain: config.chainId,
    data: data || "0x",
  };

  const transaction = FeeMarketEIP1559Transaction.fromTxData(transactionData, {
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
) => {
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
) => {
  const serializedTx = bytesToHex(signedTransaction.serialize());
  const relayed = await web3.eth.sendSignedTransaction(serializedTx);
  return relayed.transactionHash;
};

export const requestSignature = async (payload: number[], path: string) => {
  const { account } = await getNearAccount();

  const multichainContract = new Contract(
    account,
    process.env.NEAR_MULTICHAIN_CONTRACT!,
    {
      changeMethods: ["sign"],
      viewMethods: ["public_key"],
      useLocalViewExecution: false,
    }
  );
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
  data?: string
) => {
  const { transaction, payload } = await createPayload(
    sender,
    receiver,
    amount,
    data
  );

  const { big_r, big_s } = await requestSignature(payload, "ethereum,1");

  const signature = reconstructSignature(transaction, big_r, big_s, sender);

  await relayTransaction(signature);
};
