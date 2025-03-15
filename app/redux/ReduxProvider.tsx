"use client";

import { PropsWithChildren, useEffect } from "react";
import { Provider } from "react-redux";
import { initializeWebSocket, updatePricesAsync } from "./portfolioSlice";
import { store } from "./store";

export default function ReduxProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("portfolioState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        store.dispatch(updatePricesAsync(parsedState.assets));
      } else {
        store.dispatch({
          type: "portfolio/endLoading",
        });
      }

      store.dispatch(initializeWebSocket());

      const unsubscribe = store.subscribe(() => {
        localStorage.setItem(
          "portfolioState",
          JSON.stringify(store.getState().portfolio)
        );
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error with localStorage:", error);
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
