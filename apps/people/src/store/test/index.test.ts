import { loadSeed } from "@baseline/fixtures";
import { describe, expect, it } from "vitest";
import { createPeopleStore, resetToSeed, stateFromSeed, type RootState } from "../index";
import { memoryAdapter } from "@baseline/persistence";

describe("people store persistence", () => {
  const seed = loadSeed();

  it("seeds itself when nothing is saved", () => {
    const store = createPeopleStore({ seed, persistence: memoryAdapter() });
    expect(store.getState().employees.ids).toHaveLength(60);
  });

  it("prefers saved state over the seed", () => {
    const saved: RootState = {
      employees: { ids: [], entities: {} },
      rateRecords: { ids: [], entities: {} },
    };
    const store = createPeopleStore({ seed, persistence: memoryAdapter(saved) });
    expect(store.getState().employees.ids).toHaveLength(0);
  });

  it("writes through after every action and reset returns the seed", () => {
    const adapter = memoryAdapter<RootState>({
      employees: { ids: [], entities: {} },
      rateRecords: { ids: [], entities: {} },
    });
    const store = createPeopleStore({ seed, persistence: adapter });

    store.dispatch(resetToSeed());

    expect(store.getState()).toEqual(stateFromSeed(seed));
    expect(adapter.load()).toEqual(stateFromSeed(seed));
  });
});
