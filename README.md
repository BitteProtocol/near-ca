# NEAR Chain Abstraction Layer (NEAR-CA)

**DISCLAIMER: This should only be used for educational purposes.**

NEAR-CA is a TypeScript library designed to provide an abstraction layer for interacting with the NEAR blockchain, simplifying the process of performing transactions and managing accounts on both NEAR and Ethereum chains. This library is intended for use in server-side applications only.

## Features

- EVM Account Derivation from NEAR blockchain.
- Transaction signing and sending on the Ethereum blockchain.
- Key derivation functions for cryptographic operations.
- Support for EIP-1559 transactions on Ethereum.
- Wallet Connect intergration tools.

## Contracts

### Get Started

This project requires Node.js version 20.0.0 or higher.
If you are using nvm, you can run `nvm use` to use the node version specified in `.nvmrc`.

To install dependencies and set up the project:

```sh
# Install dependencies
yarn
# Credentials
cp .env.example .env  <---- paste your Near credentials
# Send Eth. You'll need to fund your account first.
# More details in the 'Fund your account' part of this document
npx tsx examples/send-eth.ts
```

### NEAR Credentials

Before using NEAR-CA, ensure you have the following environment variables set:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.
- `NEAR_MULTICHAIN_CONTRACT`: The NEAR contract that handles multichain operations.

Copy the `.env.example` file and add these values to the `.env` file.

For setting up a wallet, use the NEAR testnet wallet.
The testnet wallet is different from the main wallet.
For example, you can use the [Mintbase Wallet](https://testnet.wallet.mintbase.xyz/).

## Fund your account

Get your address

```sh
npx tsx examples/getEthAddress.ts
```

After getting your address fund it from one of your own wallets.

# Examples

## CLI

For Ethereum, you can derive addresses, create payloads for transactions, and send signed transactions.

For more detailed examples, see the [Examples README](./examples/README.md).

## Frontend

To install NEAR-CA in your project, run the following command:

```bash
yarn add near-ca
```

### Example: Setup NearEthAdapter and Send ETH

Here's an example of how to set up the `NearEthAdapter` and send ETH:

```typescript
import dotenv from "dotenv";
import {
  MultichainContract,
  NearEthAdapter,
  nearAccountFromKeyPair,
} from "near-ca";
import { KeyPair } from "near-api-js";

dotenv.config();
const { NEAR_ACCOUNT_ID, NEAR_ACCOUNT_PRIVATE_KEY } = process.env;

const account = await nearAccountFromKeyPair({
    accountId: NEAR_ACCOUNT_ID!,
    keyPair: KeyPair.fromString(NEAR_ACCOUNT_PRIVATE_KEY!),
    network: {
      networkId: "testnet",
      nodeUrl: "https://rpc.testnet.near.org",
    },
  });

const adapter = await NearEthAdapter.fromConfig({
  mpcContract: new MultichainContract(
    account,
    process.env.NEAR_MULTICHAIN_CONTRACT!
  ),
  // derivationPath: "ethereum,1",
});

await adapter.signAndSendTransaction({
  receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
  amount: 1n,
  chainId: 11_155_111,
  // Optional: Set nearGas (default is 300 TGAS, which sometimes might not be sufficient)
});
```

### Other Examples

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

Before using NEAR-CA, ensure you have the following environment variables set:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.
- `NEAR_MULTICHAIN_CONTRACT`: The NEAR contract that handles multichain operations.

Copy the `.env.example` file and place these values in `.env`


Steps to get your `NEAR_ACCOUNT_ID` and `NEAR_ACCOUNT_PRIVATE_KEY`:

1. Create a mintbase wallet, super easy, here: https://wallet.mintbase.xyz/
2. Your `XYZ.testnet` is your `NEAR_ACCOUNT_ID`.
3. In mintbase, on the top right corner click on the gear (settings) icon.
4. Go to "Security & Recovery" -> "Export Account".
5. After the exporting is complete click on "Private Key" and copy it.
6. Paste it to `NEAR_ACCOUNT_PRIVATE_KEY` in your `.env` file.
