## Examples

You can run any of the following example scripts using the command:

```bash
npx tsx examples/*.ts
```

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
