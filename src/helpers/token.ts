import { ethers } from "ethers";

export function parseUnits(amount: ethers.BigNumberish, decimals: ethers.BigNumberish = 18) {
  return parseFloat(ethers.utils.formatUnits(amount, decimals));
}
