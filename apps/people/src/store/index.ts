import type { SeedData } from "@baseline/fixtures";
import type { PersistenceAdapter } from "@baseline/persistence";
import {
  combineReducers,
  configureStore,
  createAction,
  createListenerMiddleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { employeesAdapter, employeesReducer } from "./employeesSlice";
import { rateRecordsAdapter, rateRecordsReducer } from "./rateRecordsSlice";

const sliceReducer = combineReducers({
  employees: employeesReducer,
  rateRecords: rateRecordsReducer,
});

export type RootState = ReturnType<typeof sliceReducer>;
export const resetToSeed = createAction("people/resetToSeed");

export function stateFromSeed(seed: SeedData): RootState {
  return {
    employees: employeesAdapter.setAll(employeesAdapter.getInitialState(), seed.employees),
    rateRecords: rateRecordsAdapter.setAll(rateRecordsAdapter.getInitialState(), seed.rateRecords),
  };
}

export function isPersistedState(value: unknown): value is RootState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { employees?: unknown; rateRecords?: unknown };
  return hasEntityShape(candidate.employees) && hasEntityShape(candidate.rateRecords);
}

interface PeopleStoreOptions {
  readonly seed: SeedData;
  readonly persistence: PersistenceAdapter<RootState>;
}

function hasEntityShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as { ids?: unknown }).ids);
}

export function createPeopleStore({ seed, persistence }: PeopleStoreOptions) {
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

export type PeopleStore = ReturnType<typeof createPeopleStore>;
export type AppDispatch = PeopleStore["dispatch"];
