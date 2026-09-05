import "@baseline/theme/tokens.css";
import "@baseline/theme/base.css";

import type { MountFn } from "@baseline/contracts";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { allocationsSnapshotReceived } from "./store/capacitySlice";
import { getPeopleStore } from "./store/instance";
import { hostSnapshotReceived } from "./store/hostSlice";

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

  const unsubscribeHost = context.host
    ? (() => {
        store.dispatch(hostSnapshotReceived(context.host.snapshot()));
        return context.host.subscribe((state) => store.dispatch(hostSnapshotReceived(state)));
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
    unsubscribeHost();
    root.unmount();
  };
};
