/// A short list of networks with known wrapped tokens.
export const CHAIN_INFO: {
  [key: number]: { icon?: string; wrappedToken: string };
} = {
  11155111: {
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=014",
    wrappedToken: "0xD0A1E359811322d97991E03f863a0C30C2cF029C",
  },
  1: {
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=014",
    wrappedToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  100: {
    icon: "https://cryptologos.cc/logos/gnosis-gno-logo.svg?v=014",
    wrappedToken: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
  },
  137: {
    wrappedToken: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  },
  42161: {
    wrappedToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
  10: {
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
  8453: {
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
};
