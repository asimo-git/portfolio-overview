import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchInitialPrices } from "../utils/helpers";
import { Asset } from "../utils/interfaces";

interface PortfolioState {
  assets: Asset[];
  totalCost: number;
  isLoading: boolean;
}

const initialState: PortfolioState = {
  assets: [],
  totalCost: 0,
  isLoading: true,
};

export const updatePricesAsync = createAsyncThunk(
  "portfolio/updatePrices",
  async (assets: Asset[]) => {
    const pairs = assets.map((asset) => asset.name + "USDT");
    const priceData = await fetchInitialPrices(pairs);

    if (!priceData) return assets;

    return assets.map((asset) => ({
      ...asset,
      price: priceData[asset.name + "USDT"]?.price || asset.price,
      cost:
        (priceData[asset.name + "USDT"]?.price || asset.price) * asset.quantity,
      change: priceData[asset.name + "USDT"]?.change24h || asset.change,
    }));
  }
);

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
  reducers: {
    endLoading: (state) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addAssetAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        addAssetAsync.fulfilled,
        (state, action: PayloadAction<Asset>) => {
          state.isLoading = false;
          state.assets.push(action.payload);

          state.totalCost += action.payload.cost;

          state.assets.forEach((asset) => {
            asset.portfolioShare = (asset.cost / state.totalCost) * 100;
          });
        }
      )
      .addCase(addAssetAsync.rejected, (state, action) => {
        state.isLoading = false;
        console.error("Ошибка загрузки актива:", action.error);
      })
      .addCase(updatePricesAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        updatePricesAsync.fulfilled,
        (state, action: PayloadAction<Asset[]>) => {
          state.isLoading = false;
          state.assets = action.payload;
          state.totalCost = action.payload.reduce(
            (sum, asset) => sum + asset.cost,
            0
          );

          state.assets.forEach((asset) => {
            asset.portfolioShare = (asset.cost / state.totalCost) * 100;
          });
        }
      )
      .addCase(updatePricesAsync.rejected, (state, action) => {
        state.isLoading = false;
        console.error("Ошибка обновления цен:", action.error);
      });
  },
});

export default portfolioSlice.reducer;
