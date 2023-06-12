import { Token } from "@constants";

type CoinmarketcapToken = "eco" | "usd-coin";

function getCoinmarketcapToken(token: Token): CoinmarketcapToken {
  if (token === Token.USDC) return "usd-coin";
  return "eco";
}

export async function getTokenPrice(token: Token): Promise<number> {
  try {
    const url = new URL("/v2/cryptocurrency/quotes/latest", "https://pro-api.coinmarketcap.com");

    const coinmarketcapToken = getCoinmarketcapToken(token);

    url.searchParams.set("slug", coinmarketcapToken);
    url.searchParams.set("CMC_PRO_API_KEY", process.env.REACT_APP_COINMARKETCAP_API_KEY!);

    const { data } = await fetch(url).then(res => res.json());
    /* eslint-disable */
    return (Object.values(data) as any)[0].quote.USD.price;
  } catch (e) {
    console.warn(`[coinmarketcap:getTokenPrice] failed to get ${token} price`, e);
    return 0;
  }
}
