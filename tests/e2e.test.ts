import { SEPOLIA_CHAIN_ID, setupNearEthAdapter } from "../examples/setup";
import { mockAdapter, NearEthAdapter, Network } from "../src";
import { getBalance } from "viem/actions";
import dotenv from "dotenv";
import { recoverTypedDataAddress, recoverMessageAddress } from "viem";
dotenv.config();

describe("End To End", () => {
  let mockedAdapter: NearEthAdapter;
  let realAdapter: NearEthAdapter;
  const to = "0xdeADBeeF0000000000000000000000000b00B1e5";
  const ONE_WEI = 1n;
  const chainId = SEPOLIA_CHAIN_ID;

  beforeAll(async () => {
    realAdapter = await setupNearEthAdapter();
    mockedAdapter = await mockAdapter(process.env.ETH_PK! as `0x${string}`);
  });

  afterAll(async () => {
    clearTimeout(undefined);
  });

  it("Adapter.getBalance", async () => {
    await expect(realAdapter.getBalance(chainId)).resolves.not.toThrow();
  });

  it.skip("signAndSendTransaction", async () => {
    await expect(
      realAdapter.signAndSendTransaction({
        // Sending 1 WEI to self (so we never run out of funds)
        to: realAdapter.address,
        value: ONE_WEI,
        chainId,
      })
    ).resolves.not.toThrow();
  });

  it.skip("signAndSendTransaction - Gnosis Chain", async () => {
    await expect(
      realAdapter.signAndSendTransaction({
        // Sending 1 WEI to self (so we ~never run out of funds)
        to: realAdapter.address,
        value: ONE_WEI,
        // Gnosis Chain!
        chainId: 100,
      })
    ).resolves.not.toThrow();
  });

  it("Fails to sign and send", async () => {
    const network = Network.fromChainId(chainId);
    const senderBalance = await getBalance(network.client, {
      address: mockedAdapter.address,
    });
    await expect(
      realAdapter.signAndSendTransaction({
        to,
        value: senderBalance + ONE_WEI,
        chainId,
      })
    ).rejects.toThrow();
  }, 15000);

  it("signMessage", async () => {
    const message = "NearEth";
    const signature = await mockedAdapter.signMessage(message);
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature,
    });
    expect(recoveredAddress).toBe(mockedAdapter.address);
  });

  it("signTypedData", async () => {
    const message = {
      from: {
        name: "Cow",
        wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
      },
      to: {
        name: "Bob",
        wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
      },
      contents: "Hello, Bob!",
    } as const;

    const domain = {
      name: "Ether Mail",
      version: "1",
      chainId: 1,
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    } as const;

    const types = {
      Person: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
      ],
      Mail: [
        { name: "from", type: "Person" },
        { name: "to", type: "Person" },
        { name: "contents", type: "string" },
      ],
    } as const;

    const typedData = {
      types,
      primaryType: "Mail",
      message,
      domain,
    } as const;
    const signature = await mockedAdapter.signTypedData(typedData);

    const recoveredAddress = await recoverTypedDataAddress({
      ...typedData,
      signature,
    });
    expect(recoveredAddress).toBe(mockedAdapter.address);
  });
});
