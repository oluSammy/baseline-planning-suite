import type { MountFn } from "@baseline/contracts";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import { loadSeed } from "@baseline/fixtures";

import { App } from "./App";
import { createPeopleStore } from "./store";

export const mount: MountFn = (container) => {
  const root = createRoot(container);
  const store = createPeopleStore(loadSeed());
  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  return () => root.unmount();
};
