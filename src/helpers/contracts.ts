import { ethers } from "ethers";

export async function hasWalletBeenDeployed(
  provider: ethers.providers.JsonRpcProvider,
  address: string,
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== "0x";
  } catch (e) {
    console.error("Error determining if SWA is already deployed", e);
  }
  return false;
}

export async function getTransaction(
  provider: ethers.providers.JsonRpcProvider,
  txHash: string,
  retry = 3,
): Promise<ethers.providers.TransactionResponse> {
  // Wait 3s
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) return getTransaction(provider, txHash, retry - 1);
    return tx;
  } catch (err) {
    if (!retry) throw err;
    return getTransaction(provider, txHash, retry - 1);
  }
}
