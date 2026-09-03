import { loadSeed } from "@baseline/fixtures";
import { describe, expect, it } from "vitest";
import { createPeopleStore } from "../index";
import { selectAllEmployees, selectEmployeesMatching } from "../selectors";
import { memoryAdapter } from "../persistence";

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
});
