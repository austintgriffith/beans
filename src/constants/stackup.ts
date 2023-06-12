import { ethers } from "ethers";

export const STACKUP_API_KEY = process.env.STACKUP_API_KEY!;
export const VERIFYING_PAYMASTER_ADDRESS = ethers.utils.getAddress("0xE93ECa6595fe94091DC1af46aaC2A8b5D7990770");

export interface ExecutionResult {
  paid: ethers.BigNumber;
  preOpGas: ethers.BigNumber;
  targetResult: string;
  targetSuccess: boolean;
  validAfter: number;
  validUntil: number;
}
