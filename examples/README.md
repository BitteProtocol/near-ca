## Examples

You can run any of the following example scripts using the command:

```bash
npx tsx examples/*.ts
```

### NEAR Credentials

Before using NEAR-CA, ensure you have the following environment variables set in your `.env` file:

- `NEAR_ACCOUNT_ID`: Your NEAR account identifier.
- `MPC_CONTRACT_ID`: The NEAR contract that handles multichain operations.
- `NETWORK`: Either `near` or `testnet`.
- `NEAR_ACCOUNT_PRIVATE_KEY`: Your NEAR account private key.

Copy the `.env.example` file and add these values to the `.env` file.

For setting up a wallet, use the NEAR testnet wallet.
The testnet wallet is different from the main wallet.
For example, you can use the [Bitte Wallet](https://testnet.wallet.bitte.ai/).

## Fund your account

Get your address

```sh
npx tsx examples/getEthAddress.ts
```

After getting your address fund it from one of your own wallets.

Here are some of the available examples:

1. **Basic:**
   - [Send ETH](./send-eth.ts)
2. **WETH Operations:**
   - [Deposit (Wrap-ETH)](./weth/wrap.ts)
   - [Withdraw (Unwrap-ETH)](./weth/unwrap.ts)
3. **NFT Operations:**
   - [Transfer ERC721](./nft/erc721/transfer.ts)
4. **Advanced:**
   - [Buy NFT on OpenSea](./opensea.ts)

## Example: Buy NFT by Collection Slug

To buy an NFT using a collection slug, follow these steps:

```sh
# Install dependencies
yarn

# Set up credentials
cp .env.example .env  # Paste your NEAR credentials into the .env file

# Run the OpenSea example script
npx tsx examples/opensea.ts
```

You will be prompted to provide a `collectionSlug`.

### What is a Collection Slug?

A collection slug identifies a specific collection on OpenSea. To find a collection slug:

1. Visit [testnet.opensea](https://testnets.opensea.io/).
2. Browse and find a collection you like.
3. Copy the slug from the URL: `https://testnets.opensea.io/collection/[slug]`.

For example, if the URL is `https://testnets.opensea.io/collection/the-monkey-chainz`, the collection slug is `the-monkey-chainz`.
