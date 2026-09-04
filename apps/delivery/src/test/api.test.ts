import { month, personMonths, type BreakdownItemId, type EmployeeId } from "@baseline/domain";
import { loadSeed } from "@baseline/fixtures";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it, vi } from "vitest";
import { createAllocationsApi } from "../api";
import { createDeliveryStore } from "../store";
import { allocationSet } from "../store/allocationsSlice";
import { peopleSnapshotReceived } from "../store/peopleSlice";

describe("delivery api", () => {
  const seed = loadSeed();

  it("publishes per person-month totals, never allocations or items", () => {
    const api = createAllocationsApi(createDeliveryStore({ seed, persistence: memoryAdapter() }));
    const snapshot = api.snapshot();
    expect(snapshot.loads.length).toBeGreaterThan(0);
    expect(Object.keys(snapshot)).toEqual(["loads"]);
    expect(snapshot.loads[0]).toEqual(
      expect.objectContaining({
        employeeId: expect.any(String),
        month: expect.any(String),
        total: expect.any(Number),
      }),
    );
  });

  it("notifies on an allocation change and stays quiet on unrelated actions", () => {
    const store = createDeliveryStore({ seed, persistence: memoryAdapter() });
    const listener = vi.fn();
    createAllocationsApi(store).subscribe(listener);

    store.dispatch(
      peopleSnapshotReceived({ employees: seed.employees, rateRecords: seed.rateRecords }),
    );
    expect(listener).not.toHaveBeenCalled();

    store.dispatch(
      allocationSet({
        itemId: "wbs-012" as BreakdownItemId,
        employeeId: "emp-001" as EmployeeId,
        month: month("2026-03"),
        amount: personMonths(0.75),
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
