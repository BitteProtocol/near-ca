import dotenv from "dotenv";
import { MultichainContract } from "../src/mpc_contract";
import { NearEthAdapter } from "../src/chains/ethereum";
import { nearAccountFromEnv } from "../src/chains/near";

export async function setupNearEthAdapter(): Promise<NearEthAdapter> {
  dotenv.config();
  const account = await nearAccountFromEnv();
  return NearEthAdapter.fromConfig({
    evm: {
      providerUrl: process.env.NODE_URL!,
      scanUrl: process.env.SCAN_URL!,
      gasStationUrl: process.env.GAS_STATION_URL!,
    },
    near: {
      mpcContract: new MultichainContract(
        account,
        process.env.NEAR_MULTICHAIN_CONTRACT!
      ),
      derivationPath: "ethereum,1",
    },
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
