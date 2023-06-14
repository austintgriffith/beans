import { ethers } from "ethers";

export enum Token {
  ECO = "eco",
  USDC = "usdc",
}

export const ECO_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_ECO_TOKEN_ADDRESS!);
export const USDC_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.REACT_APP_USDC_TOKEN_ADDRESS!);

export function getTokenInfo(token: string) {
  switch (token) {
    case Token.ECO:
      return { id: token, name: "ECO", address: ECO_TOKEN_ADDRESS, decimals: 18 };
    case Token.USDC:
      return { id: token, name: "USDC", address: USDC_TOKEN_ADDRESS, decimals: 6 };
    default:
      throw new Error("Unsupported token");
  }
}
