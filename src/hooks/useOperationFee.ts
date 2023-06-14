import { BigNumber, ethers } from "ethers";
import { useQuery } from "react-query";

import { round } from "@helpers";
import { parseUnits } from "@helpers/token";
import { getTokenPrice } from "@helpers/market";
import { getTokenInfo, Token } from "@constants";

export enum FeeOperation {
  Transfer,
  Share,
}

export const FLAT_FEE_AMOUNT = ethers.utils.parseEther(process.env.REACT_APP_FLAT_FEE_AMOUNT!);

async function getOperationFee(token: Token, operation: FeeOperation): Promise<BigNumber> {
  if (token === Token.ECO) return FLAT_FEE_AMOUNT;

  // Get Prices from Coingecko
  const [ecoPrice, tokenPrice] = await Promise.all([getTokenPrice(Token.ECO), getTokenPrice(token)]);

  const ecoFee = parseUnits(await getOperationFee(Token.ECO, operation));
  // Fees for all other tokens as charged double the fee
  const tokenFee = 2 * ecoFee * ecoPrice * (1 / tokenPrice);
  const { decimals } = getTokenInfo(token);
  return ethers.utils.parseUnits(round(tokenFee, decimals).toString(), decimals);
}

export const useOperationFee = (token: Token, operation: FeeOperation = FeeOperation.Transfer) => {
  return useQuery(["operation-fee", token, operation], () => getOperationFee(token, operation), {
    refetchInterval: 20_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
};
