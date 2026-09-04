import { loadSeed } from "@baseline/fixtures";
import { localStorageAdapter } from "@baseline/persistence";
import { createDeliveryStore, isPersistedState, type DeliveryStore } from "./index";

const STORAGE_KEY = "baseline.delivery.v1";

let instance: DeliveryStore | null = null;

/**
 * The one store for this container. `./mount` renders it and `./api`
 * publishes from it, so both must see the same instance. Created on first
 * use, not at import time.
 */
export function getDeliveryStore(): DeliveryStore {
  instance ??= createDeliveryStore({
    seed: loadSeed(),
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });
  return instance;
}
