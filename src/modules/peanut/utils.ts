import { Token } from "@constants";

export enum ClaimSearchParams {
  NETWORK = "c",
  VERSION = "v",
  PASSWORD = "p",
  DEPOSIT_ID = "i",
  TOKEN = "t",
}

export function getParamsFromLink(link = window.location.href) {
  const url = new URL(link);

  const contractVersion = url.searchParams.get(ClaimSearchParams.VERSION);
  const password = url.searchParams.get(ClaimSearchParams.PASSWORD);
  const token = (url.searchParams.get(ClaimSearchParams.TOKEN) as Token) || undefined;

  const chainId = parseInt(url.searchParams.get(ClaimSearchParams.NETWORK) || "0");
  const _depositIdx = url.searchParams.get(ClaimSearchParams.DEPOSIT_ID);
  const depositIdx = _depositIdx ? parseInt(_depositIdx) : undefined;

  return { chainId, contractVersion, depositIdx, password, token };
}
