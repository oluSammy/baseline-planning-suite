import "@baseline/theme/tokens.css";
import "@baseline/theme/base.css";

import type { MountFn } from "@baseline/contracts";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./App";
import { hostSnapshotReceived } from "./store/hostSlice";
import { getDeliveryStore } from "./store/instance";
import { peopleSnapshotReceived } from "./store/peopleSlice";

export const mount: MountFn = (container, context = {}) => {
  const store = getDeliveryStore();

  const unsubscribePeople = context.people
    ? (() => {
        store.dispatch(peopleSnapshotReceived(context.people.snapshot()));
        return context.people.subscribe((snapshot) =>
          store.dispatch(peopleSnapshotReceived(snapshot)),
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
    unsubscribePeople();
    unsubscribeHost();
    root.unmount();
  };
};
