# NEAR Chain Abstraction Layer (NEAR-CA)

**DISCLAIMER: This should only be used for educational purposes.**

NEAR-CA is a TypeScript library that provides an abstraction layer for interacting with the NEAR blockchain. It simplifies the process of performing transactions and managing accounts on NEAR and Ethereum chains.

Intended to be used on server-side applications only.

## Features

- Account management for NEAR blockchain.
- Transaction signing and sending on Ethereum blockchain.
- Key derivation functions for cryptographic operations.
- Support for EIP-1559 transactions on Ethereum.

## Local Testing

```sh
# Install
yarn
# Credentials
cp .env.example .env  <---- paste your Near credentials
# Buy NFT by collection slug:
npx ts-node examples/opensea.ts
# You will be prompted to provide a collectionSlug
```

## Installation

To install NEAR-CA, run the following command:

```bash
yarn add near-ca
```

## Usage

For Ethereum, you can derive addresses, create payloads for transactions, and send signed transactions.

### Example: Setup NearEthAdapter and Send ETH

```typescript
import dotenv from "dotenv";
import {
  MultichainContract,
  NearEthAdapter,
  nearAccountFromEnv,
} from "near-ca";

dotenv.config();
// Could also import and use nearAccountFromKeyPair here ;)
const account = await nearAccountFromEnv();

const adapter = await NearEthAdapter.fromConfig({
  mpcContract: new MultichainContract(
    account,
    process.env.NEAR_MULTICHAIN_CONTRACT!
  ),
  derivationPath: "ethereum,1",
});

await adapter.signAndSendTransaction({
  receiver: "0xdeADBeeF0000000000000000000000000b00B1e5",
  amount: 0.00000001,
  chainId: 11_155_111,
  // Optional Set nearGas (default is 300 TGAS - which still sometimes doesn't work!)
});
```

### Other Examples

Each of the following scripts can be run with

```bash
npx ts-node examples/*.ts
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
2. Your `XYZ.near` is your `NEAR_ACCOUNT_ID`.
3. In mintbase, on the top right corner click on the gear (settings) icon.
4. Go to "Security & Recovery" -> "Export Account".
5. After the exporting is complete click on "Private Key" and copy it.
6. Paste it to `NEAR_ACCOUNT_PRIVATE_KEY` in your `.env` file.

