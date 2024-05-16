import erc1155Abi from "../../abis/ERC1155.json";
import { SEPOLIA_CHAIN_ID, setupNearEthAdapter } from "../../setup";
import { encodeFunctionData } from "viem";

const run = async (): Promise<void> => {
  const evm = await setupNearEthAdapter();
  // TODO retrieve from user:
  const tokenAddress = "0x284c37b0fcb72034ff25855da57fcf097b255474";
  const tokenId = 1;
  const to = "0x8d99F8b2710e6A3B94d9bf465A98E5273069aCBd";

  const callData = encodeFunctionData({
    abi: erc1155Abi,
    functionName: "safeTransferFrom(address,address,uint256,uint256,bytes)",
    args: [evm.address, to, tokenId, 1, "0x"],
  });

  await evm.signAndSendTransaction({
    to: tokenAddress,
    data: callData,
    chainId: SEPOLIA_CHAIN_ID,
  });
};

run();
