import { hourlyCost, isoDate, type EmployeeId } from "@baseline/domain";
import { fixtureAllocationsApi, loadSeed } from "@baseline/fixtures";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it, vi } from "vitest";
import { createPeopleApi } from "../api";
import { createPeopleStore } from "../store";
import { allocationsSnapshotReceived } from "../store/capacitySlice";
import { rateAdded } from "../store/rateRecordsSlice";

describe("people api", () => {
  const seed = loadSeed();

  it("publishes employees and rates", () => {
    const api = createPeopleApi(createPeopleStore({ seed, persistence: memoryAdapter() }));
    expect(api.snapshot().employees).toHaveLength(60);
    expect(api.snapshot().rateRecords).toHaveLength(150);
  });

  it("notifies on a rate change and stays quiet on unrelated actions", () => {
    const store = createPeopleStore({ seed, persistence: memoryAdapter() });
    const listener = vi.fn();
    createPeopleApi(store).subscribe(listener);

    store.dispatch(allocationsSnapshotReceived(fixtureAllocationsApi(seed).snapshot()));
    expect(listener).not.toHaveBeenCalled();

    store.dispatch(
      rateAdded({
        employeeId: "emp-001" as EmployeeId,
        validFrom: isoDate("2026-06-01"),
        hourlyCost: hourlyCost(100),
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].rateRecords).toHaveLength(151);
  });
});
