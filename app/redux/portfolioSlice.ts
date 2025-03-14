import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchInitialPrices } from "../utils/helpers";
import { Asset } from "../utils/interfaces";

interface PortfolioState {
  assets: Asset[];
  totalCost: number;
}

const initialState: PortfolioState = {
  assets: [],
  totalCost: 0,
};

export const addAssetAsync = createAsyncThunk(
  "portfolio/addAsset",
  async (newAsset: { name: string; quantity: number }) => {
    const pair = newAsset.name + "USDT";
    const priceData = await fetchInitialPrices([pair]);
    const update = priceData ? priceData[pair] : { price: 0, change24h: 0 };

    return {
      name: newAsset.name,
      quantity: newAsset.quantity,
      price: update.price,
      cost: update.price * newAsset.quantity,
      change: update.change24h,
      portfolioShare: 0,
    };
  }
);

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(
        addAssetAsync.fulfilled,
        (state, action: PayloadAction<Asset>) => {
          state.assets.push(action.payload);

          state.totalCost += action.payload.cost;

          state.assets.forEach((asset) => {
            asset.portfolioShare = (asset.cost / state.totalCost) * 100;
          });
        }
      )
      .addCase(addAssetAsync.rejected, (state, action) => {
        console.error("Ошибка загрузки актива:", action.error);
      });
  },
});

export default portfolioSlice.reducer;
