import { useQuery } from "react-query";

export const useEcoPrice = () => {
  return useQuery(
    "eco-eth-price",
    async () => {
      try {
        const data = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=eco&vs_currencies=eth").then(res =>
          res.json(),
        );
        return data.eco.eth;
      } catch (e) {
        console.warn("[useEcoPrice] failed to get ECO/ETH price", e);
      }
    },
    { initialData: 0 },
  );
};
