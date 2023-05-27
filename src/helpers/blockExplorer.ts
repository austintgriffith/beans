import { ethers } from "ethers";
import { NETWORK } from "@constants";

export function blockExplorerLink(addressOrHash: string): string {
  const path = ethers.utils.isAddress(addressOrHash) ? `address/${addressOrHash}` : `tx/${addressOrHash}`;
  return new URL(path, NETWORK.blockExplorer).toString();
}
