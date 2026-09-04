import { loadSeed } from "@baseline/fixtures";
import { describe, expect, it } from "vitest";
import { resetToSeed, stateFromSeed, type PersistedState, createDeliveryStore } from "../index";
import { memoryAdapter } from "@baseline/persistence";
import { peopleSnapshotReceived } from "../peopleSlice";

describe("delivery store persistence", () => {
  const seed = loadSeed();

  it("seeds itself when nothing is saved", () => {
    const store = createDeliveryStore({ seed, persistence: memoryAdapter() });
    expect(store.getState().projects.ids).toHaveLength(4);
    expect(store.getState().breakdownItems.ids).toHaveLength(90);
  });

  it("prefers saved state over the seed", () => {
    const saved: PersistedState = {
      projects: { ids: [], entities: {} },
      breakdownItems: { ids: [], entities: {} },
    };
    const store = createDeliveryStore({ seed, persistence: memoryAdapter(saved) });
    expect(store.getState().projects.ids).toHaveLength(0);
  });

  it("writes through after every action and reset returns the seed", () => {
    const adapter = memoryAdapter<PersistedState>({
      projects: { ids: [], entities: {} },
      breakdownItems: { ids: [], entities: {} },
    });
    const store = createDeliveryStore({ seed, persistence: adapter });

    store.dispatch(resetToSeed());

    expect(store.getState()).toMatchObject(stateFromSeed(seed));
    expect(adapter.load()).toEqual(stateFromSeed(seed));
  });

  it("holds the People snapshot in memory but never persists it", () => {
    const adapter = memoryAdapter<PersistedState>();
    const store = createDeliveryStore({ seed, persistence: adapter });

    store.dispatch(
      peopleSnapshotReceived({ employees: seed.employees, rateRecords: seed.rateRecords }),
    );

    expect(store.getState().people.available).toBe(true);
    expect(store.getState().people.employees.ids).toHaveLength(60);
    expect(adapter.load()).not.toHaveProperty("people");
  });
});
