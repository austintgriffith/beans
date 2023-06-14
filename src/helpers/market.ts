import { Token } from "@constants";

import * as CoinGecko from "@helpers/api/coingecko";
import * as CoinMarketCap from "@helpers/api/coinmarketcap";

export async function getTokenPrice(token: Token) {
  try {
    return CoinGecko.getTokenPrice(token, "usd");
  } catch (err) {
    console.log("[error:coingecko] getTokenPrice", err);
  }

  try {
    return CoinMarketCap.getTokenPrice(token);
  } catch (err) {
    console.log("[error:coinmarketcap] getTokenPrice", err);
    throw err;
  }
}
