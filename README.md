# NEAR Chain Abstraction Layer (NEAR-CA)

**DISCLAIMER: This should only be used for educational purposes.**

NEAR-CA is a TypeScript library designed to provide an abstraction layer for interacting with the NEAR blockchain, simplifying the process of performing transactions and managing accounts on both NEAR and Ethereum chains. This library is intended for use in server-side applications only.

## Features

- Account management for the NEAR blockchain.
- Transaction signing and sending on the Ethereum blockchain.
- Key derivation functions for cryptographic operations.
- Support for EIP-1559 transactions on Ethereum.

## Contracts

### Get Started

This project requires Node.js version 20.0.0 or higher. If you are using nvm, you can run `nvm use` to use the node version specified in `.nvmrc`.

To install dependencies and set up the project:

```sh
# Install dependencies
yarn

# Set up credentials
cp .env.example .env  # Paste your NEAR credentials into the .env file

# Run example scripts
npx ts-node examples/*.ts
```

### NEAR Credentials

Before using NEAR-CA, ensure you have the following environment variables set:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.
- `NEAR_MULTICHAIN_CONTRACT`: The NEAR contract that handles multichain operations.

Copy the `.env.example` file and add these values to the `.env` file.

For setting up a wallet, use the NEAR testnet wallet. The testnet wallet is different from the main wallet. For example, you can use the [Mintbase Wallet](https://testnet.wallet.mintbase.xyz/).

### Usage

For Ethereum, you can derive addresses, create payloads for transactions, and send signed transactions.

For more detailed examples, see the [Examples README](./examples/README.md).

## Frontend

### Get Started

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
  nearAccountFromEnv,
} from "near-ca";

dotenv.config();

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
  // Optional: Set nearGas (default is 300 TGAS, which sometimes might not be sufficient)
});
```
