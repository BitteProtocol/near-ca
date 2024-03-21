import dotenv from "dotenv";
import { MultichainContract } from "../src/mpc_contract";
import { EVM } from "../src/chains/ethereum";
import { getNearAccount } from "../src/chains/near";
dotenv.config();

export async function setupNearEthConnection(): Promise<EVM> {
  // This also reads from process.env!
  const account = await getNearAccount();
  return EVM.fromConfig({
    providerUrl: process.env.NODE_URL!,
    scanUrl: process.env.SCAN_URL!,
    gasStationUrl: process.env.GAS_STATION_URL!,
    mpcContract: new MultichainContract(
      account,
      process.env.NEAR_MULTICHAIN_CONTRACT!
    ),
    derivationPath: "ethereum,1",
  });
}
