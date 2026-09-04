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
import { capacityReducer } from "./capacitySlice";
import { hostReducer } from "./hostSlice";

const sliceReducer = combineReducers({
  employees: employeesReducer,
  rateRecords: rateRecordsReducer,
  capacity: capacityReducer,
  host: hostReducer,
});

export type RootState = ReturnType<typeof sliceReducer>;
export const resetToSeed = createAction("people/resetToSeed");

/** What survives a reload. The Delivery copy is deliberately excluded. */
export type PersistedState = Omit<RootState, "capacity" | "host">;

function toPersisted(state: RootState): PersistedState {
  const { capacity: _capacity, host: _host, ...persisted } = state;
  return persisted;
}

const emptyCapacity = () => capacityReducer(undefined, { type: "@@init" });
const emptyHost = () => hostReducer(undefined, { type: "@@init" });

export function stateFromSeed(seed: SeedData): PersistedState {
  return {
    employees: employeesAdapter.setAll(employeesAdapter.getInitialState(), seed.employees),
    rateRecords: rateRecordsAdapter.setAll(rateRecordsAdapter.getInitialState(), seed.rateRecords),
  };
}

function hasEntityShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  return Array.isArray((value as { ids?: unknown }).ids);
}

export function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { employees?: unknown; rateRecords?: unknown };
  return hasEntityShape(candidate.employees) && hasEntityShape(candidate.rateRecords);
}

interface PeopleStoreOptions {
  readonly seed: SeedData;
  readonly persistence: PersistenceAdapter<PersistedState>;
}

export function createPeopleStore({ seed, persistence }: PeopleStoreOptions) {
  const seedState = stateFromSeed(seed);

  const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState =>
    resetToSeed.match(action)
      ? { ...seedState, capacity: state?.capacity ?? emptyCapacity(), host: emptyHost() }
      : sliceReducer(state, action);

  const persist = createListenerMiddleware<RootState>();
  persist.startListening({
    predicate: () => true,
    effect: (_action, api) => persistence.save(toPersisted(api.getState())),
  });

  const persisted = persistence.load() ?? seedState;

  return configureStore({
    reducer: rootReducer,
    preloadedState: { ...persisted, capacity: emptyCapacity(), host: emptyHost() },
    middleware: (getDefault) => getDefault().prepend(persist.middleware),
  });
}

export type PeopleStore = ReturnType<typeof createPeopleStore>;
export type AppDispatch = PeopleStore["dispatch"];
