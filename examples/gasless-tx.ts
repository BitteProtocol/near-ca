import dotenv from "dotenv";
import { ethers } from "ethers";
import { createSmartAccountClient } from "@biconomy/account";
import { PaymasterMode } from "@biconomy/paymaster";

const run = async (): Promise<void> => {
  dotenv.config();
  const config = {
    // chain: "sepolia",
    // chainId: 11155111,
    rpcUrl: "https://rpc.sepolia.ethpandaops.io",
    privateKey: process.env.RELAYER_PK!,
    biconomyPaymasterApiKey: process.env.PAYMASTER_KEY!,
    bundlerUrl: process.env.BUNDLER_URL!,
  };

  // Generate EOA from private key using ethers.js
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const relayer = new ethers.Wallet(config.privateKey, provider);

  // const biconomyPaymaster = await createPaymaster({
  //   paymasterUrl: process.env.PAYMASTER_URL!,
  // });
  console.log("Bundler:", process.env.PAYMASTER_URL);
  const smartWallet = await createSmartAccountClient({
    signer: relayer,
    bundlerUrl: config.bundlerUrl,
    biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
  });

  const saAddress = await smartWallet.getAccountAddress();
  console.log("SA Address", saAddress);

  const tx = {
    to: "0x1111111111111111111111111111111111111111",
    value: 0, // Can't send non-zero values (or tx will fail)
    data: "0xdeadbeef",
  };

  // Send the transaction and get the transaction hash
  const userOpResponse = await smartWallet.sendTransaction(tx, {
    paymasterServiceData: { mode: PaymasterMode.SPONSORED },
  });
  const { transactionHash } = await userOpResponse.waitForTxHash();
  console.log("Transaction Hash", transactionHash);
  const userOpReceipt = await userOpResponse.wait();
  if (userOpReceipt.success == "true") {
    console.log("UserOp receipt", userOpReceipt);
    console.log("Transaction receipt", userOpReceipt.receipt);
  }
};
run();
