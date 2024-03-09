# NEAR Chain Abstraction Layer (NEAR-CA)

**DISCLAIMER: This should only be used for educational purposes.**

NEAR-CA is a TypeScript library that provides an abstraction layer for interacting with the NEAR blockchain. It simplifies the process of performing transactions and managing accounts on NEAR and Ethereum chains. 

Intended to be used on server-side applications only. This works best with [Bun](https://bun.sh).

## Features

- Account management for NEAR blockchain.
- Transaction signing and sending on Ethereum blockchain.
- Key derivation functions for cryptographic operations.
- Support for EIP-1559 transactions on Ethereum.

## Installation

To install NEAR-CA, run the following command:

```bash
bun add near-ca
```

Alternatively,

```bash
npm  add near-ca
```

```bash
pnpm  add near-ca
```

## Usage

For Ethereum, you can derive addresses, create payloads for transactions, and send signed transactions.

Example: Deriving an Ethereum address and sending a transaction

```typescript
const ethAddress = await deriveEthAddress("ethereum,1");
const functionSignature = web3.eth.abi.encodeFunctionCall(
    {
    name: "safeMint",
    type: "function",
    inputs: [
        {
        type: "address",
        name: "to",
        },
    ],
    },
    ["0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA"]
);

await signAndSendTransaction(
    ethAddress,
    "0xAA5FcF171dDf9FE59c985A28747e650C2e9069cA",
    0,
    functionSignature
);
```

## Examples

1. [Mint NFT](./examples/mint-nft.ts)
1. [Send ETH](./examples/send-eth.ts)

## Configuration

Before using NEAR-CA, ensure you have the following environment variables set:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.
- `NEAR_MULTICHAIN_CONTRACT`: The NEAR contract that handles multichain operations.

Copy the `.env.example` file and place these values in `.env`