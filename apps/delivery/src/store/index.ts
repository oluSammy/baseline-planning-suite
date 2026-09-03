import type { SeedData } from "@baseline/fixtures";
import type { PersistenceAdapter } from "@baseline/persistence";
import {
  combineReducers,
  configureStore,
  createAction,
  createListenerMiddleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { breakdownItemsAdapter, breakdownItemsReducer } from "./breakdownItemsSlice";
import { projectsAdapter, projectsReducer } from "./projectsSlice";

const sliceReducer = combineReducers({
  projects: projectsReducer,
  breakdownItems: breakdownItemsReducer,
});

export type RootState = ReturnType<typeof sliceReducer>;
export const resetToSeed = createAction("delivery/resetToSeed");

export function stateFromSeed(seed: SeedData): RootState {
  return {
    projects: projectsAdapter.setAll(projectsAdapter.getInitialState(), seed.projects),
    breakdownItems: breakdownItemsAdapter.setAll(
      breakdownItemsAdapter.getInitialState(),
      seed.breakdownItems,
    ),
  };
}

function hasEntityShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as { ids?: unknown }).ids);
}

export function isPersistedState(value: unknown): value is RootState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { projects?: unknown; breakdownItems?: unknown };
  return hasEntityShape(candidate.projects) && hasEntityShape(candidate.breakdownItems);
}

interface DeliveryStoreOptions {
  readonly seed: SeedData;
  readonly persistence: PersistenceAdapter<RootState>;
}

export function createDeliveryStore({ seed, persistence }: DeliveryStoreOptions) {
  const seedState = stateFromSeed(seed);

  const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState =>
    resetToSeed.match(action) ? seedState : sliceReducer(state, action);

  const persist = createListenerMiddleware<RootState>();
  persist.startListening({
    predicate: () => true,
    effect: (_action, api) => persistence.save(api.getState()),
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState: persistence.load() ?? seedState,
    middleware: (getDefault) => getDefault().prepend(persist.middleware),
  });
}

export type DeliveryStore = ReturnType<typeof createDeliveryStore>;
export type AppDispatch = DeliveryStore["dispatch"];
