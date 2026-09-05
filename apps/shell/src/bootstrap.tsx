import "@baseline/theme/tokens.css";
import "@baseline/theme/base.css";

import { registerRemotes, loadRemote } from "@module-federation/enhanced/runtime";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadShellConfig } from "./config";
import type {
  AllocationsApiModule,
  MountContext,
  PeopleApiModule,
  RemoteName,
} from "@baseline/contracts";
import { getShellStore } from "./store/instance";
import { createHostContext } from "./hostContext";
import { Provider } from "react-redux";

async function loadOptional<T>(id: string): Promise<T | null> {
  try {
    return await loadRemote<T>(id);
  } catch (error) {
    console.warn(`shell: ${id} unavailable`, error);
    return null;
  }
}

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Shell: #root element not found");
  }

  const config = await loadShellConfig();

  registerRemotes(Object.entries(config.remotes).map(([name, entry]) => ({ name, entry })));
  const [peopleModule, allocationsModule] = await Promise.all([
    loadOptional<PeopleApiModule>("people/api"),
    loadOptional<AllocationsApiModule>("delivery/api"),
  ]);

  const store = getShellStore();
  const host = createHostContext(store);

  const contexts: Record<RemoteName, MountContext> = {
    people: {
      host,
      ...(allocationsModule ? { allocations: allocationsModule.allocationsApi } : {}),
    },
    delivery: { host, ...(peopleModule ? { people: peopleModule.peopleApi } : {}) },
  };

  createRoot(container).render(
    <Provider store={store}>
      <App contexts={contexts} peopleApi={peopleModule?.peopleApi ?? null} />
    </Provider>,
  );
}

void start();
