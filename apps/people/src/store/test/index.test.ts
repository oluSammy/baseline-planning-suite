import { fixtureAllocationsApi, loadSeed } from "@baseline/fixtures";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it } from "vitest";
import { allocationsSnapshotReceived } from "../capacitySlice";
import { createPeopleStore, resetToSeed, stateFromSeed, type PersistedState } from "../index";
import { hostSnapshotReceived } from "../hostSlice";

const empty: PersistedState = {
  employees: { ids: [], entities: {} },
  rateRecords: { ids: [], entities: {} },
};

describe("people store persistence", () => {
  const seed = loadSeed();

  it("seeds itself when nothing is saved", () => {
    const store = createPeopleStore({ seed, persistence: memoryAdapter() });
    expect(store.getState().employees.ids).toHaveLength(60);
    expect(store.getState().rateRecords.ids).toHaveLength(150);
  });

  it("prefers saved state over the seed", () => {
    const store = createPeopleStore({ seed, persistence: memoryAdapter(empty) });
    expect(store.getState().employees.ids).toHaveLength(0);
  });

  it("writes through after every action and reset returns the seed", () => {
    const adapter = memoryAdapter<PersistedState>(empty);
    const store = createPeopleStore({ seed, persistence: adapter });

    store.dispatch(resetToSeed());

    expect(store.getState()).toMatchObject(stateFromSeed(seed));
    expect(adapter.load()).toEqual(stateFromSeed(seed));
  });

  it("holds the Delivery snapshot in memory but never persists it", () => {
    const adapter = memoryAdapter<PersistedState>();
    const store = createPeopleStore({ seed, persistence: adapter });

    store.dispatch(allocationsSnapshotReceived(fixtureAllocationsApi(seed).snapshot()));

    expect(store.getState().capacity.available).toBe(true);
    expect(store.getState().capacity.loads.length).toBeGreaterThan(0);
    expect(adapter.load()).not.toHaveProperty("capacity");
  });

  it("holds the host snapshot in memory but never persists it", () => {
    const adapter = memoryAdapter<PersistedState>();
    const store = createPeopleStore({ seed, persistence: adapter });

    store.dispatch(
      hostSnapshotReceived({ currency: { code: "USD", perEur: 1.08 }, activeUser: null }),
    );

    expect(store.getState().host.currency.code).toBe("USD");
    expect(adapter.load()).not.toHaveProperty("host");
  });
});
