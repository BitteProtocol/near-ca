/// A short list of networks with known wrapped tokens.
const ETHER_ICON = "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024";

export const CHAIN_INFO: {
  [key: number]: {
    icon?: string;
    wrappedToken: string;
    currencyIcon?: string;
    testnet: boolean;
  };
} = {
  1: {
    icon: ETHER_ICON,
    wrappedToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    testnet: false,
  },
  10: {
    icon: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=024",
    wrappedToken: "0x4200000000000000000000000000000000000006",
    currencyIcon: ETHER_ICON,
    testnet: false,
  },
  56: {
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=024",
    wrappedToken: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    testnet: false,
  },
  97: {
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=024",
    wrappedToken: "0x094616f0bdfb0b526bd735bf66eca0ad254ca81f",
    testnet: true,
  },
  100: {
    icon: "https://cryptologos.cc/logos/gnosis-gno-gno-logo.svg?v=002",
    wrappedToken: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
    currencyIcon: "https://docs.gnosischain.com/img/tokens/xdai.png",
    testnet: false,
  },
  137: {
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=024",
    wrappedToken: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
    testnet: false,
  },
  8453: {
    icon: "https://avatars.githubusercontent.com/u/108554348?s=48&v=4",
    wrappedToken: "0x4200000000000000000000000000000000000006",
    currencyIcon: ETHER_ICON,
    testnet: false,
  },
  42161: {
    icon: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=024",
    wrappedToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    currencyIcon: ETHER_ICON,
    testnet: true,
  },
  84532: {
    wrappedToken: "0x4200000000000000000000000000000000000006",
    currencyIcon: ETHER_ICON,
    testnet: true,
  },
  421614: {
    currencyIcon: ETHER_ICON,
    wrappedToken: "0x980b62da83eff3d4576c647993b0c1d7faf17c73",
    testnet: true,
  },
  11155111: {
    icon: ETHER_ICON,
    wrappedToken: "0xD0A1E359811322d97991E03f863a0C30C2cF029C",
    testnet: true,
  },
};
