import { loadSeed } from "@baseline/fixtures";
import { localStorageAdapter } from "@baseline/persistence";
import { createPeopleStore, isPersistedState, type PeopleStore } from "./index";

const STORAGE_KEY = "baseline.people.v1";

let instance: PeopleStore | null = null;

/**
 * The one store for this container. `./mount` renders it and `./api`
 * publishes from it, so both must see the same instance. Created on first
 * use, not at import time.
 */
export function getPeopleStore(): PeopleStore {
  instance ??= createPeopleStore({
    seed: loadSeed(),
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });
  return instance;
}
