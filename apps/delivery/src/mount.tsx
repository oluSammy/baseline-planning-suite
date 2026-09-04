import type { MountFn } from "@baseline/contracts";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./App";
import { peopleSnapshotReceived } from "./store/peopleSlice";
import { getDeliveryStore } from "./store/instance";

export const mount: MountFn = (container, context = {}) => {
  const store = getDeliveryStore();

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
