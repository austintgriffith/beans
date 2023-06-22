import { ethers } from "ethers";
import { NETWORK } from "@constants/network";

export enum Token {
  ECO = "eco",
  USDC = "usdc",
}

export const ECO_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_ECO_TOKEN_ADDRESS!);
export const USDC_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_USDC_TOKEN_ADDRESS!);

export const ECO_TOKEN_ADDRESS_BASE = ethers.utils.getAddress(process.env.REACT_APP_ECO_TOKEN_ADDRESS_BASE!);
export const USDC_TOKEN_ADDRESS_BASE = ethers.utils.getAddress(process.env.REACT_APP_USDC_TOKEN_ADDRESS_BASE!);

export function getTokenInfo(token: string, network = NETWORK.chainId) {
  const isBaseChain = network === 8453 || network === 84531;
  switch (token) {
    case Token.ECO:
      return {
        id: token,
        name: "ECO",
        address: isBaseChain ? ECO_TOKEN_ADDRESS_BASE : ECO_TOKEN_ADDRESS,
        decimals: 18,
      };
    case Token.USDC:
      return {
        id: token,
        name: "USDC",
        address: isBaseChain ? USDC_TOKEN_ADDRESS_BASE : USDC_TOKEN_ADDRESS,
        decimals: 6,
      };
    default:
      throw new Error("Unsupported token");
  }
}
