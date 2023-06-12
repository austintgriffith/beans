import { ethers } from "ethers";

export function convertAmount(amount = "0", decimals = 18) {
  try {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  } catch (e) {
    const floatVal = parseFloat(amount.toString()).toFixed(8);
    return ethers.utils.parseUnits(floatVal.toString(), decimals);
  }
}

export function convertTokenAmount(amount: ethers.BigNumber, decimals = 18) {
  return parseFloat(ethers.utils.formatUnits(amount, decimals));
}
