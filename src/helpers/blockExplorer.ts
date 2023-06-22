import { ethers } from "ethers";
import { NETWORK } from "@constants";

export function blockExplorerLink(addressOrHash: string, network = NETWORK): string {
  const path = ethers.utils.isAddress(addressOrHash) ? `address/${addressOrHash}` : `tx/${addressOrHash}`;
  return new URL(path, network.blockExplorer).toString();
}
