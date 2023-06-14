import { Token } from "@constants";

type CoingeckoToken = "eco" | "usd-coin";
type CoingeckoCurrency = "eth" | "usd";

function getCoingeckoToken(token: Token): CoingeckoToken {
  if (token === Token.USDC) return "usd-coin";
  return "eco";
}

export async function getTokenPrice(token: Token, currency: CoingeckoCurrency = "eth"): Promise<number> {
  try {
    const coingeckoToken = getCoingeckoToken(token);
    const data = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoToken}&vs_currencies=${currency}`,
    ).then(res => res.json());
    return data[coingeckoToken][currency];
  } catch (e) {
    console.warn(`[coingecko:getTokenPrice] failed to get ${token}/${currency} price`, e);
    return 0;
  }
}
