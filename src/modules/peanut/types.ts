import { ethers } from "ethers";

export interface Deposit {
  contractType: number;
  tokenAddress: string;
  pubKey20: string;
  amount: ethers.BigNumber;
  tokenId: ethers.BigNumber;
}

export interface ClaimRequest {
  password: string;
  depositIdx: number;
  recipient: string;
  network: string;
}
