import type { MountFn } from "@baseline/contracts";
import { Provider } from "react-redux";
import { localStorageAdapter } from "@baseline/persistence";
import { createRoot } from "react-dom/client";
import { loadSeed } from "@baseline/fixtures";

import { App } from "./App";
import { createPeopleStore, isPersistedState } from "./store";
import { allocationsSnapshotReceived } from "./store/capacitySlice";

const STORAGE_KEY = "baseline.people.v1";

export const mount: MountFn = (container, context = {}) => {
  const store = createPeopleStore({
    seed: loadSeed(),
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });
  const unsubscribe = context.allocations
    ? (() => {
        store.dispatch(allocationsSnapshotReceived(context.allocations.snapshot()));
        return context.allocations.subscribe((snapshot) =>
          store.dispatch(allocationsSnapshotReceived(snapshot)),
        );
      })()
    : () => {};

  const root = createRoot(container);

  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  return () => {
    unsubscribe();
    root.unmount();
  };
};
