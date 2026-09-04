import { describe, expect, it } from "vitest";
import { loadSeed } from "../index";

describe("seed fixtures", () => {
  const seed = loadSeed();

  it("carries the counts stated", () => {
    expect(seed.employees).toHaveLength(60);
    expect(seed.rateRecords).toHaveLength(150);
    expect(seed.projects).toHaveLength(4);
    expect(seed.breakdownItems).toHaveLength(90);
    expect(seed.allocations).toHaveLength(720);
  });

  it("contains the reference employee and the 12 March 2026 rate change", () => {
    const okafor = seed.employees.find((e) => e.name === "Adaeze Okafor");
    expect(okafor?.weeklyHours).toBe(40);

    const rates = seed.rateRecords
      .filter((r) => r.employeeId === okafor?.id)
      .map((r) => [r.validFrom, r.hourlyCost]);
    expect(rates).toEqual([
      ["2025-01-01", 80],
      ["2026-03-12", 95],
    ]);

    const marchCell = seed.allocations.find(
      (a) => a.employeeId === okafor?.id && a.month === "2026-03",
    );
    expect(marchCell?.amount).toBe(0.5);
  });

  it("has no dangling references", () => {
    const employeeIds = new Set(seed.employees.map((e) => e.id));
    const itemIds = new Set(seed.breakdownItems.map((b) => b.id));
    const projectIds = new Set(seed.projects.map((p) => p.id));

    for (const rate of seed.rateRecords) expect(employeeIds.has(rate.employeeId)).toBe(true);
    for (const item of seed.breakdownItems) {
      expect(projectIds.has(item.projectId)).toBe(true);
      if (item.parentId !== null) expect(itemIds.has(item.parentId)).toBe(true);
    }
    for (const alloc of seed.allocations) {
      expect(employeeIds.has(alloc.employeeId)).toBe(true);
      expect(itemIds.has(alloc.breakdownItemId)).toBe(true);
    }
  });
});
