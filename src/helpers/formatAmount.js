import { ethers } from "ethers";

export function formatAmount(amount) {
  try {
    return ethers.utils.parseEther(amount.toString());
  } catch (e) {
    const floatVal = parseFloat(amount).toFixed(8);
    return ethers.utils.parseEther(floatVal.toString());
  }
}
