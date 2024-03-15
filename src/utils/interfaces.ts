import { ethers } from "ethers";
import erc721ABI from "../abis/ERC721.json";
import erc1155ABI from "../abis/ERC1155.json";
import seaport from "../abis/Seaport.json";

export function erc721Interface(): ethers.Interface {
  return new ethers.Interface(erc721ABI);
}

export function erc1155Interface(): ethers.Interface {
  return new ethers.Interface(erc1155ABI);
}

export function openSeaInterface(): ethers.Interface {
  return new ethers.Interface(seaport);
}
