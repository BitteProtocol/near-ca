import { OpenSeaSDK, Chain, OrderSide } from "opensea-js";
import { setupAccount } from "./setup";
import { provider, signAndSendTransaction } from "../src/chains/ethereum";
import { openSeaInterface } from "../src/utils/interfaces";
const openseaSDK = new OpenSeaSDK(provider, {
  chain: Chain.Sepolia,
  // apiKey: YOUR_API_KEY,
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uses OpenseaSDK:
// https://github.com/ProjectOpenSea/opensea-js/blob/main/developerDocs/advanced-use-cases.md

const run = async (): Promise<void> => {
  // const slug = "marksman-ladders-v3";
  // const slug = "mintbase-chain-abstraction";
  // const slug = "wutangkillabeez-1";
  // const slug = "ums-econtract-1";
  const slug = "mintbase-chain-abstraction-v2";
  console.log("Retrieving Listings for...");
  const listings = await openseaSDK.api.getAllListings(slug);
  // console.log("Listings:", listings);
  if (listings.listings.length === 0) {
    console.log(`No available listings for collection: ${slug}`);
    return;
  }
  console.log(
    `Got ${listings.listings.length} Listings, preparing to purchase first available.`
  );
  const firstListing = listings.listings[0];
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

  // @ts-expect-error: Undocumented field on type FulfillmentData within FulfillmentDataResponse
  const order = input_data.parameters;
  // @ts-expect-error: Undocumented field on type FulfillmentData within FulfillmentDataResponse
  const fulfillerConduitKey = input_data.fulfillerConduitKey;
  let callData = "0x";
  if (tx.function.includes("fulfillOrder")) {
    console.log("Using fulfillOrder");
    callData = openSeaInterface().encodeFunctionData("fulfillOrder", [
      order,
      fulfillerConduitKey,
    ]);
  } else {
    console.log("Using fulfillBasicOrder_efficient_6GL6yc");
    callData = openSeaInterface().encodeFunctionData(
      "fulfillBasicOrder_efficient_6GL6yc",
      [order]
    );
  }
  await signAndSendTransaction(sender, tx.to, tx.value / 10 ** 18, callData);
};

run();
