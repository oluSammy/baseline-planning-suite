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
import { peopleReducer } from "./peopleSlice";
import { allocationsReducer, allocationsAdapter } from "./allocationsSlice";

const sliceReducer = combineReducers({
  projects: projectsReducer,
  breakdownItems: breakdownItemsReducer,
  people: peopleReducer,
  allocations: allocationsReducer,
});

export type RootState = ReturnType<typeof sliceReducer>;
export const resetToSeed = createAction("delivery/resetToSeed");

// this survives a reload, people omitted deliberately
export type PersistedState = Omit<RootState, "people">;

function toPersisted(state: RootState): PersistedState {
  const { people: _people, ...persisted } = state;
  return persisted;
}

const emptyPeople = () => peopleReducer(undefined, { type: "@@init" });

export function stateFromSeed(seed: SeedData): PersistedState {
  return {
    projects: projectsAdapter.setAll(projectsAdapter.getInitialState(), seed.projects),
    breakdownItems: breakdownItemsAdapter.setAll(
      breakdownItemsAdapter.getInitialState(),
      seed.breakdownItems,
    ),
    allocations: allocationsAdapter.setAll(allocationsAdapter.getInitialState(), seed.allocations),
  };
}

function hasEntityShape(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Array.isArray((value as { ids?: unknown }).ids);
}

export function isPersistedState(value: unknown): value is PersistedState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { projects?: unknown; breakdownItems?: unknown; allocations: unknown };
  return (
    hasEntityShape(candidate.projects) &&
    hasEntityShape(candidate.breakdownItems) &&
    hasEntityShape(candidate.allocations)
  );
}

interface DeliveryStoreOptions {
  readonly seed: SeedData;
  readonly persistence: PersistenceAdapter<PersistedState>;
}

export function createDeliveryStore({ seed, persistence }: DeliveryStoreOptions) {
  const seedState = stateFromSeed(seed);

  const rootReducer = (state: RootState | undefined, action: UnknownAction): RootState =>
    resetToSeed.match(action)
      ? { ...seedState, people: state?.people ?? emptyPeople() }
      : sliceReducer(state, action);

  const persist = createListenerMiddleware<RootState>();
  persist.startListening({
    predicate: () => true,
    effect: (_action, api) => persistence.save(toPersisted(api.getState())),
  });

  const persisted = persistence.load() ?? seedState;

  return configureStore({
    reducer: rootReducer,
    preloadedState: { ...persisted, people: emptyPeople() },
    middleware: (getDefault) => getDefault().prepend(persist.middleware),
  });
}

export type DeliveryStore = ReturnType<typeof createDeliveryStore>;
export type AppDispatch = DeliveryStore["dispatch"];
