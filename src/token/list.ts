type Token = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI: string;
};

type TokenList = {
  [key: number]: Token[];
};

export const TOKEN_LIST: TokenList = {
  100: [
    {
      symbol: "COW",
      name: "CoW Protocol Token",
      address: "0x177127622c4A00F3d409B75571e12cB3c8973d3c",
      decimals: 18,
      chainId: 100,
      logoURI:
        "https://gateway.pinata.cloud/ipfs/QmQxFkVZzXFyWf73rcFwNPaEqG5hBwYXrwrBEX3aWJrn2r/cowprotocol.png",
    },
  ],
  1: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      decimals: 6,
      chainId: 1,
      logoURI:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      decimals: 18,
      chainId: 1,
      logoURI:
        "https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      decimals: 6,
      chainId: 1,
      logoURI:
        "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      decimals: 18,
      chainId: 1,
      logoURI:
        "https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png",
    },
    {
      symbol: "GNO",
      name: "Gnosis",
      address: "0x6810e776880c02933d47db1b9fc05908e5386b96",
      decimals: 18,
      chainId: 1,
      logoURI:
        "https://tokens.1inch.io/0x6810e776880c02933d47db1b9fc05908e5386b96.png",
    },
    {
      symbol: "COW",
      name: "CoW Protocol Token",
      address: "0xDEf1CA1fb7FBcDC777520aa7f396b4E015F497aB",
      decimals: 18,
      chainId: 1,
      logoURI:
        "https://gateway.pinata.cloud/ipfs/QmQxFkVZzXFyWf73rcFwNPaEqG5hBwYXrwrBEX3aWJrn2r/cowprotocol.png",
    },
  ],
  11155111: [
    {
      symbol: "COW",
      name: "CoW Protocol Token",
      address: "0x0625afb445c3b6b7b929342a04a22599fd5dbb59",
      decimals: 18,
      chainId: 11155111,
      logoURI:
        "https://gateway.pinata.cloud/ipfs/QmQxFkVZzXFyWf73rcFwNPaEqG5hBwYXrwrBEX3aWJrn2r/cowprotocol.png",
    },
    {
      symbol: "USDC",
      name: "USDC (Sepolia)",
      address: "0xbe72e441bf55620febc26715db68d3494213d8cb",
      decimals: 6,
      chainId: 11155111,
      logoURI:
        "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
    },
  ],
};
