import { useQuery } from "react-query";

type CoingeckoToken = "eco" | "usd-coin";
type CoingeckoCurrency = "eth";

export async function getTokenPrice(token: CoingeckoToken, currency: CoingeckoCurrency = "eth"): Promise<number> {
  try {
    const data = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=${currency}`,
    ).then(res => res.json());
    return data[token][currency];
  } catch (e) {
    console.warn(`[useTokenPrice] failed to get ${token}/${currency} price`, e);
    return 0;
  }
}

export const useTokenPrice = (token: CoingeckoToken, currency: CoingeckoCurrency = "eth") => {
  return useQuery<unknown, unknown, number>(["token-price", token, currency], () => getTokenPrice(token, currency), {
    initialData: 0,
    refetchInterval: 10_000, // Refetch every 10s
  });
};
