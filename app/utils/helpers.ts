import { PriceUpdate, Ticker24hrData } from "./interfaces";

export const fetchInitialPrices = async (
  pairs: string[]
): Promise<PriceUpdate | undefined> => {
  try {
    const symbolsParam = encodeURIComponent(JSON.stringify(pairs));

    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    const prices: PriceUpdate = {};

    data.forEach((item: Ticker24hrData) => {
      const symbol = item.symbol;
      prices[symbol] = {
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
      };
    });

    return prices;
  } catch (error) {
    console.error("Ошибка при получении начальных данных:", error);
    return undefined;
  }
};
