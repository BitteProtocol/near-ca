/// A short list of networks with known wrapped tokens.
const ETHER_ICON = "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=024";

export const CHAIN_INFO: {
  [key: number]: {
    currencyIcon?: string;
    icon?: string;
    testnet: boolean;
    wrappedToken: string;
  };
} = {
  1: {
    icon: ETHER_ICON,
    testnet: false,
    wrappedToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  10: {
    currencyIcon: ETHER_ICON,
    icon: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg?v=024",
    testnet: false,
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
  56: {
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=024",
    testnet: false,
    wrappedToken: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  97: {
    icon: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=024",
    testnet: true,
    wrappedToken: "0x094616f0bdfb0b526bd735bf66eca0ad254ca81f",
  },
  100: {
    currencyIcon: "https://docs.gnosischain.com/img/tokens/xdai.png",
    icon: "https://cryptologos.cc/logos/gnosis-gno-gno-logo.svg?v=002",
    testnet: false,
    wrappedToken: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
  },
  137: {
    icon: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=024",
    testnet: false,
    wrappedToken: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
  },
  8453: {
    currencyIcon: ETHER_ICON,
    icon: "https://avatars.githubusercontent.com/u/108554348?s=48&v=4",
    testnet: false,
    wrappedToken: "0x4200000000000000000000000000000000000006",
  },
  42161: {
    currencyIcon: ETHER_ICON,
    icon: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg?v=024",
    wrappedToken: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    testnet: true,
  },
  84532: {
    currencyIcon: ETHER_ICON,
    wrappedToken: "0x4200000000000000000000000000000000000006",
    testnet: true,
  },
  421614: {
    currencyIcon: ETHER_ICON,
    testnet: true,
    wrappedToken: "0x980b62da83eff3d4576c647993b0c1d7faf17c73",
  },
  11155111: {
    icon: ETHER_ICON,
    testnet: true,
    wrappedToken: "0xD0A1E359811322d97991E03f863a0C30C2cF029C",
  },
};
