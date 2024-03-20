import { OpenSeaSDK, Chain, OrderSide } from "opensea-js";
import { setupAccount } from "./setup";
import { signAndSendTransaction } from "../src/chains/ethereum";
import { sleep } from "../src/utils/sleep";
import * as readline from "readline";
import { ethers } from "ethers";
import { client } from "../src/config";
import { Address, Hex, encodeFunctionData } from "viem";
import seaportABI from "../src/abis/Seaport.json";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// This script uses the OpenSea SDK:
// https://github.com/ProjectOpenSea/opensea-js/blob/main/developerDocs/advanced-use-cases.md
const run = async (slug: string): Promise<void> => {
  // This fake provider is required to construct an openseaSDK instance (although we do not make use of it).
  const provider = new ethers.JsonRpcProvider(
    "fakeURL",
    await client.getChainId()
  );
  const openseaSDK = new OpenSeaSDK(provider, {
    chain: Chain.Sepolia,
    // apiKey: YOUR_API_KEY,
  });
  // const slug = "mintbase-chain-abstraction-v2";

  console.log("Retrieving Listings for...");
  const listings = await openseaSDK.api.getAllListings(slug);
  if (listings.listings.length === 0) {
    console.log(`No available listings for collection: ${slug}`);
    return;
  }
  console.log(
    `Got ${listings.listings.length} Listings, preparing to purchase first available.`
  );
  const firstListing = listings.listings[0];
  // This sleep is due to free-tier testnet rate limiting.
  await sleep(1000);
  const sender = await setupAccount();
  const data = await openseaSDK.api.generateFulfillmentData(
    sender,
    firstListing.order_hash,
    firstListing.protocol_address,
    OrderSide.ASK
  );

  const tx = data.fulfillment_data.transaction;
  const input_data = tx.input_data;

  // TODO - report or fix these bugs with OpenseaSDK
  // @ts-expect-error: Undocumented field on type FulfillmentData within FulfillmentDataResponse
  const order = input_data.parameters;
  // @ts-expect-error: Undocumented field on type FulfillmentData within FulfillmentDataResponse
  const fulfillerConduitKey = input_data.fulfillerConduitKey;

  const openSeaInterface = new ethers.Interface(seaportABI);

  let callData = "0x";
  if (tx.function.includes("fulfillOrder")) {
    console.log("Using fulfillOrder");
    callData = encodeFunctionData({
      abi: seaportABI,
      functionName: "fulfillOrder",
      args: [order, fulfillerConduitKey],
    });
  } else {
    console.log("Using fulfillBasicOrder_efficient_6GL6yc");
    callData = encodeFunctionData({
      abi: seaportABI,
      functionName: "fulfillBasicOrder_efficient_6GL6yc",
      args: [order],
    });
  }
  await signAndSendTransaction(
    sender,
    tx.to as Address,
    tx.value / 10 ** 18,
    callData as Hex
  );
};

rl.question("Provide collection slug: ", (input) => {
  run(input);
});
