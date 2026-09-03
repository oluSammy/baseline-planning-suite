import type { MountFn } from "@baseline/contracts";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import { loadSeed } from "@baseline/fixtures";

import { App } from "./App";
import { createPeopleStore, isPersistedState } from "./store";
import { localStorageAdapter } from "./store/persistence";

export const mount: MountFn = (container) => {
  const STORAGE_KEY = "baseline.people.v1";

  const store = createPeopleStore({
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
