import type { MountFn } from "@baseline/contracts";
import { loadSeed } from "@baseline/fixtures";
import { localStorageAdapter } from "@baseline/persistence";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./App";
import { createDeliveryStore, isPersistedState } from "./store";
import { peopleSnapshotReceived } from "./store/peopleSlice";

const STORAGE_KEY = "baseline.delivery.v1";

export const mount: MountFn = (container, context = {}) => {
  const store = createDeliveryStore({
    seed: loadSeed(),
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });

  const unsubscribe = context.people
    ? (() => {
        store.dispatch(peopleSnapshotReceived(context.people.snapshot()));
        return context.people.subscribe((snapshot) =>
          store.dispatch(peopleSnapshotReceived(snapshot)),
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
