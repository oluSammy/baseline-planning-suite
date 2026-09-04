import type { MountFn } from "@baseline/contracts";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { allocationsSnapshotReceived } from "./store/capacitySlice";
import { getPeopleStore } from "./store/instance";

export const mount: MountFn = (container, context = {}) => {
  const store = getPeopleStore();
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
