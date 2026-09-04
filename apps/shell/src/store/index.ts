import type { HostState } from "@baseline/contracts";
import type { PersistenceAdapter } from "@baseline/persistence";
import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { hostReducer } from "./hostSlice";

const rootReducer = combineReducers({ host: hostReducer });

export type RootState = ReturnType<typeof rootReducer>;

/** Everything in the shell store is persisted: two preferences. */
export type PersistedState = RootState;

export function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== "object" || value === null) return false;
  const host = (value as { host?: Partial<HostState> }).host;
  return (
    typeof host === "object" &&
    host !== null &&
    typeof host.currency?.code === "string" &&
    typeof host.currency.perEur === "number" &&
    (host.activeUser === null || typeof host.activeUser === "string")
  );
}

interface ShellStoreOptions {
  readonly persistence: PersistenceAdapter<PersistedState>;
}

export function createShellStore({ persistence }: ShellStoreOptions) {
  const persist = createListenerMiddleware<RootState>();
  persist.startListening({
    predicate: () => true,
    effect: (_action, api) => persistence.save(api.getState()),
  });

  const persisted = persistence.load();

  return configureStore({
    reducer: rootReducer,
    ...(persisted ? { preloadedState: persisted } : {}),
    middleware: (getDefault) => getDefault().prepend(persist.middleware),
  });
}

export type ShellStore = ReturnType<typeof createShellStore>;
export type AppDispatch = ShellStore["dispatch"];
