import { ethers } from "ethers";
import erc721ABI from '../abis/ERC721.json';

export function erc721Interface(): ethers.utils.Interface {
  return new ethers.utils.Interface(erc721ABI);
}
