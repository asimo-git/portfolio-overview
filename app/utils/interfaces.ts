export interface PriceUpdate {
  [pair: string]: {
    price: number;
    change24h: number;
  };
}

export interface Ticker24hrData {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

export interface Asset {
  name: string;
  quantity: number;
  price: number | string;
  cost: number;
  change: number;
  portfolioShare: number;
}

export interface NewAsset {
  name: string;
  quantity: number;
}
