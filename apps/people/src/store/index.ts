import type { SeedData } from "@baseline/fixtures";
import {
  combineReducers,
  configureStore,
  createAction,
  createListenerMiddleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { employeesAdapter, employeesReducer } from "./employeesSlice";
import type { PersistenceAdapter } from "./persistence";

const sliceReducer = combineReducers({
  employees: employeesReducer,
});

export type RootState = ReturnType<typeof sliceReducer>;
export const resetToSeed = createAction("people/resetToSeed");

export function stateFromSeed(seed: SeedData): RootState {
  return {
    employees: employeesAdapter.setAll(employeesAdapter.getInitialState(), seed.employees),
  };
}

export function isPersistedState(value: unknown): value is RootState {
  if (typeof value !== "object" || value === null) return false;
  const employees = (value as { employees?: unknown }).employees;
  if (typeof employees !== "object" || employees === null) return false;
  return Array.isArray((employees as { ids?: unknown }).ids);
}

interface PeopleStoreOptions {
  readonly seed: SeedData;
  readonly persistence: PersistenceAdapter<RootState>;
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
