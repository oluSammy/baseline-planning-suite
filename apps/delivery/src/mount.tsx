import type { MountFn } from "@baseline/contracts";
import { createRoot } from "react-dom/client";
import { loadSeed } from "@baseline/fixtures";
import { localStorageAdapter } from "@baseline/persistence";
import { Provider } from "react-redux";
import { createDeliveryStore, isPersistedState } from "./store";
import { App } from "./App";

const STORAGE_KEY = "baseline.delivery.v1";

export const mount: MountFn = (container) => {
  const store = createDeliveryStore({
    seed: loadSeed(),
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  return () => root.unmount();
};
