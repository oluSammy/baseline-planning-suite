import { fixtureAllocationsApi, loadSeed } from "@baseline/fixtures";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it } from "vitest";
import { createPeopleStore } from "../index";
import {
  selectAllEmployees,
  selectEmployeesMatching,
  selectOversubscribedMonths,
} from "../selectors";
import type { EmployeeId } from "@baseline/domain";
import { allocationsSnapshotReceived } from "../capacitySlice";

describe("people selectors", () => {
  const state = createPeopleStore({ seed: loadSeed(), persistence: memoryAdapter() }).getState();

  it("lists every employee alphabetically", () => {
    const names = selectAllEmployees(state).map((e) => e.name);
    expect(names).toHaveLength(60);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("matches on name or role, ignoring case", () => {
    expect(selectEmployeesMatching(state, "OKAFOR").map((e) => e.name)).toContain("Adaeze Okafor");
    expect(selectEmployeesMatching(state, "tech lead").length).toBeGreaterThan(0);
    expect(selectEmployeesMatching(state, "")).toHaveLength(60);
  });

  it("lists the months a person is over capacity across all projects", () => {
    const store = createPeopleStore({ seed: loadSeed(), persistence: memoryAdapter() });
    store.dispatch(allocationsSnapshotReceived(fixtureAllocationsApi(loadSeed()).snapshot()));

    const months = selectOversubscribedMonths(store.getState()).get("emp-003" as EmployeeId);
    expect(months?.map((m) => m.month)).toEqual(["2026-06"]);
    expect(months?.[0]?.total).toBeCloseTo(1.18, 12);
  });
});
