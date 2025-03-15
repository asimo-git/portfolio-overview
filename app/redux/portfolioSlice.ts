import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchInitialPrices } from "../utils/helpers";
import { Asset } from "../utils/interfaces";
import { AppDispatch } from "./store";

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

let websocket: WebSocket | null = null;
const subscribedPairs: Set<string> = new Set();
console.log("start", subscribedPairs);

const sendRequest = (
  pair: string,
  method: "SUBSCRIBE" | "UNSUBSCRIBE"
): void => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(
      JSON.stringify({
        method,
        params: [`${pair.toLowerCase()}usdt@ticker`],
        id: Date.now(),
      })
    );
    console.log(`📡 ${method} на ${pair.toLowerCase()}usdt@ticker`);
  }
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

    if (!subscribedPairs.has(newAsset.name)) {
      sendRequest(newAsset.name, "SUBSCRIBE");
      subscribedPairs.add(newAsset.name);
      console.log(subscribedPairs);
    }

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

export const initializeWebSocket = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>("portfolio/initializeWebSocket", async (_, { dispatch, getState }) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    return;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
  }

  websocket = new WebSocket("wss://stream.binance.com:9443/ws");

  websocket.onopen = () => {
    console.log("WebSocket соединение установлено");

    subscribedPairs.forEach((pair) => {
      sendRequest(pair, "SUBSCRIBE");
    });

    const state = getState() as { portfolio: PortfolioState };
    const assets = state.portfolio.assets;

    assets.forEach((asset) => {
      if (!subscribedPairs.has(asset.name)) {
        sendRequest(asset.name, "SUBSCRIBE");
        subscribedPairs.add(asset.name);
      }
    });
  };

  websocket.onclose = () => {
    console.log("WebSocket соединение закрыто");

    setTimeout(() => {
      dispatch(initializeWebSocket());
    }, 5000);
  };

  websocket.onerror = (error) => {
    console.error("WebSocket ошибка:", error);
  };

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.e === "24hrTicker") {
        const symbol = data.s;
        const assetName = symbol.replace("USDT", "");

        const price = parseFloat(data.c);
        const changePercent = parseFloat(data.P);

        dispatch(
          updateAssetPrice({
            name: assetName,
            price,
            change: changePercent,
          })
        );
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения WebSocket:", error);
    }
  };
});

// Thunk для обновления подписок
export const subscribeToAsset = (assetName: string) => {
  if (!subscribedPairs.has(assetName)) {
    sendRequest(assetName, "SUBSCRIBE");
    subscribedPairs.add(assetName);
  }
};

// Thunk для отписки от актива
export const removeAssetAsync = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch; state: { portfolio: PortfolioState } }
>("portfolio/removeAsset", async (assetName, { dispatch, getState }) => {
  dispatch(removeAsset(assetName));

  const state = getState();
  const assetStillExists = state.portfolio.assets.some(
    (asset) => asset.name === assetName
  );

  if (!assetStillExists) {
    sendRequest(assetName, "UNSUBSCRIBE");
    subscribedPairs.delete(assetName);
  }
});

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    endLoading: (state) => {
      state.isLoading = false;
    },
    updateAssetPrice: (
      state,
      action: PayloadAction<{
        name: string;
        price: number;
        change: number;
      }>
    ) => {
      const { name, price, change } = action.payload;
      const assetIndex = state.assets.findIndex((asset) => asset.name === name);

      if (assetIndex !== -1) {
        const asset = state.assets[assetIndex];
        const oldCost = asset.cost;
        const newCost = price * asset.quantity;

        state.assets[assetIndex] = {
          ...asset,
          price,
          cost: newCost,
          change,
        };

        state.totalCost = state.totalCost - oldCost + newCost;

        state.assets.forEach((asset) => {
          asset.portfolioShare = (asset.cost / state.totalCost) * 100;
        });
      }
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      const assetName = action.payload;
      const assetIndex = state.assets.findIndex(
        (asset) => asset.name === assetName
      );

      if (assetIndex !== -1) {
        const assetCost = state.assets[assetIndex].cost;
        state.totalCost -= assetCost;
        state.assets.splice(assetIndex, 1);

        if (state.totalCost > 0) {
          state.assets.forEach((asset) => {
            asset.portfolioShare = (asset.cost / state.totalCost) * 100;
          });
        }
      }
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

export const { endLoading, updateAssetPrice, removeAsset } =
  portfolioSlice.actions;
export default portfolioSlice.reducer;
