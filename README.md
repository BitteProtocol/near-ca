# NEAR Chain Abstraction Layer (NEAR-CA)

NEAR-CA is a TypeScript library designed to provide an abstraction layer for interacting with the NEAR blockchain, simplifying the process of performing transactions and managing accounts on both NEAR and Ethereum chains. This library is intended for use in server-side applications only.

## Features

- EVM Account Derivation from NEAR blockchain.
- Transaction signing and sending on the Ethereum blockchain.
- Key derivation functions for cryptographic operations.
- Support for EIP-1559 transactions on Ethereum.
- Wallet Connect intergration tools.

### Usage

## CLI

For Ethereum, you can derive addresses, create payloads for transactions, and send signed transactions.

For more detailed usage examples, see the [Examples README](./examples/README.md).

## Integrations

[near-safe](https://github.com/BitteProtocol/near-safe) extends this tool kit by using the EOA as an owner of an ERC-4337 [Safe](https://safe.global/) account.

## Frontend/UI

Install near-ca, run the following command:

```bash
yarn add near-ca
```

### Example: Setup NearEthAdapter and Send ETH

Here's an example of how to set up the `NearEthAdapter` and send ETH:

```typescript
import dotenv from "dotenv";
import {
  broadcastSignedTransaction,
  convertToAction,
  isRlpHex,
  setupAdapter,
  signatureFromOutcome,
} from "near-ca";

dotenv.config();
const { NEAR_ACCOUNT_ID, NEAR_ACCOUNT_PRIVATE_KEY } = process.env;

const adapter = await setupAdapter({
  accountId: NEAR_ACCOUNT_ID!,
  mpcContractId: MPC_CONTRACT_ID!,
  // privateKey: NEAR_ACCOUNT_PRIVATE_KEY!, // Optional depending on setup
});

const {
  evmMessage,
  nearPayload: { receiverId, actions },
} = await evm.encodeSignRequest({
  method: "eth_sendTransaction",
  chainId: 11_155_111, // Sepolia
  params: [
    {
      from: evm.address,
      to: "0xdeADBeeF0000000000000000000000000b00B1e5",
      value: "0x01", // 1 WEI
      // data: "0x", // Optional
    },
  ],
});
console.log(`Requesting Signature for ${evmMessage}`);
// Using your near Account, send the nearPaylod as signature request:
const nearAccount = adapter.nearAccount();
//
const outtcome = await nearAccount.signAndSendTransaction({
  receiverId,
  actions: actions.map((a) => convertToAction(a)),
});
const signature = signatureFromOutcome(outtcome);
console.log("Signature aquired!");
if (isRlpHex(evmMessage)) {
  // This will be true for what we built above.
  broadcastSignedTransaction({ transaction: evmMessage, signature });
} else {
  // Use Signature for whatever else.
}
```

### Other Examples (CLI)

These examples require Private Key to be supplied:

Each of the following scripts can be run with

```bash
npx tsx examples/*.ts
```

1. [(Basic) Send ETH](./examples/send-eth.ts)
2. **WETH**
   - [Deposit (aka wrap-ETH)](./examples/weth/wrap.ts)
   - [Withdraw (aka unwrap-ETH)](./examples/weth/wrap.ts)
3. [Transfer ERC721](./examples/nft/erc721/transfer.ts)
4. [(Advanced) Buy NFT On Opensea](./examples/opensea.ts)

## Configuration

Before using NEAR-CA, ensure you have the following environment variables set in your `.env` file:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.
- `MPC_CONTRACT_ID`: The NEAR contract that handles multichain operations.
- `NETWORK`: Either `near` or `testnet`.

Copy the `.env.example` file and add these values to the `.env` file.

Steps to get your `NEAR_ACCOUNT_ID` and `NEAR_ACCOUNT_PRIVATE_KEY`:

1. Create a Near wallet address, super easy, here: https://wallet.bitte.ai/
2. Your `XYZ.near` is your `NEAR_ACCOUNT_ID`.
3. [Visit Settings Page](https://wallet.bitte.ai/settings)
4. Go to "Security & Recovery" -> "Export Account".
5. After the exporting is complete click on "Private Key" and copy it.
6. Paste it to `NEAR_ACCOUNT_PRIVATE_KEY` in your `.env` file.
