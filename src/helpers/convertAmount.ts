import { ethers } from "ethers";

export function convertAmount(amount = "0") {
  try {
    return ethers.utils.parseEther(amount.toString());
  } catch (e) {
    const floatVal = parseFloat(amount.toString()).toFixed(8);
    return ethers.utils.parseEther(floatVal.toString());
  }
}

export function convertTokenAmount(amount: ethers.BigNumber, decimals = 18) {
  return parseFloat(ethers.utils.formatUnits(amount, decimals));
}
