import { ethers } from "ethers";
import erc721ABI from "../abis/ERC721.json";
import erc1155ABI from "../abis/ERC1155.json";
import seaportABI from "../abis/Seaport.json";
import wethABI from "../abis/WETH.json";

export function erc721Interface(): ethers.Interface {
  return new ethers.Interface(erc721ABI);
}

export function erc1155Interface(): ethers.Interface {
  return new ethers.Interface(erc1155ABI);
}

export function openSeaInterface(): ethers.Interface {
  return new ethers.Interface(seaportABI);
}

export function wethInterface(): ethers.Interface {
  return new ethers.Interface(wethABI);
}
