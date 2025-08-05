import { configFromNetworkId, setupAdapter } from "../../src/";

const mpcContractId = "v1.signer-prod.testnet";
const derivationPath = "ethereum,1";

describe("index", () => {
  it("setupAdapter", async () => {
    const adapter = await setupAdapter({
      accountId: "your-account.testnet",
      network: {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
      },
      mpcContractId,
      derivationPath,
    });
    expect(adapter.address).toBe("0x5898502fc8577c5a0ae0c6984bb33c394c11a0a5");
  });

  it("setupAdapter with private Key", async () => {
    const adapter = await setupAdapter({
      accountId: "your-account.testnet",
      network: {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
      },
      mpcContractId,
      derivationPath,
      privateKey:
        "ed25519:3UEFmgr6SdPJYekHgQgaLjbHeqHnJ5FmpdQ6NxD2u1618y3hom7KrDxFEZJixYGg9XBxtwrs4hxb2ChYBMf2bCMp",
    });
    expect(adapter.address).toBe("0x5898502fc8577c5a0ae0c6984bb33c394c11a0a5");
  });

  it("setupAdapter fails", async () => {
    const accountId = "your-account.testnet";
    const networkId = "mainnet";
    const config = {
      accountId,
      network: configFromNetworkId(networkId),
      mpcContractId,
    };
    await expect(setupAdapter(config)).rejects.toThrow(
      `accountId ${accountId} doesn't match the networkId ${networkId}. Please ensure that your accountId is correct and corresponds to the intended network.`
    );
  });

  it("configFromNetworkId", async () => {
    expect(configFromNetworkId("mainnet")).toStrictEqual({
      networkId: "mainnet",
      nodeUrl: "https://rpc.mainnet.near.org",
    });

    expect(configFromNetworkId("testnet")).toStrictEqual({
      networkId: "testnet",
      nodeUrl: "https://rpc.testnet.near.org",
    });
  });
});
