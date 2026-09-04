import { describe, expect, it } from "vitest";
import { capacityKey, isOverCapacity, overCapacity, personMonthLoads } from "../capacity";
import {
  month,
  personMonths,
  type Allocation,
  type AllocationId,
  type BreakdownItemId,
  type EmployeeId,
} from "../model";

const emp = "e1" as EmployeeId;
const june = month("2026-06");
const alloc = (id: string, item: string, amount: number, updatedAt?: string): Allocation => ({
  id: id as AllocationId,
  breakdownItemId: item as BreakdownItemId,
  employeeId: emp,
  month: june,
  amount: personMonths(amount),
  ...(updatedAt === undefined ? {} : { updatedAt }),
});

describe("overCapacity", () => {
  it("sums across items and projects and flags above one person-month", () => {
    const flags = overCapacity([alloc("a", "p1-item", 0.6), alloc("b", "p2-item", 0.6)]);
    expect(flags.get(capacityKey(emp, june))?.total).toBeCloseTo(1.2, 12);
  });

  it("treats exactly 1.0 and float noise as within capacity", () => {
    expect(overCapacity([alloc("a", "x", 0.5), alloc("b", "y", 0.5)]).size).toBe(0);
    expect(overCapacity(Array.from({ length: 10 }, (_, i) => alloc(`a${i}`, "x", 0.1))).size).toBe(
      0,
    );
  });

  it("names the most recently edited allocation as the culprit", () => {
    const flags = overCapacity([
      alloc("old", "x", 0.7, "2026-09-01T10:00:00Z"),
      alloc("new", "y", 0.7, "2026-09-02T10:00:00Z"),
      alloc("seeded", "z", 0.1),
    ]);
    expect(flags.get(capacityKey(emp, june))?.culprit.id).toBe("new");
  });

  it("falls back to the last seeded row when nothing has been edited", () => {
    const flags = overCapacity([alloc("first", "x", 0.7), alloc("last", "y", 0.7)]);
    expect(flags.get(capacityKey(emp, june))?.culprit.id).toBe("last");
  });
});

describe("personMonthLoads", () => {
  it("sums per person-month and leaves the over-capacity decision to isOverCapacity", () => {
    const loads = personMonthLoads([alloc("a", "x", 0.6), alloc("b", "y", 0.6)]);
    expect(loads).toEqual([{ employeeId: emp, month: june, total: 1.2 }]);
    expect(isOverCapacity(1.2)).toBe(true);
    expect(isOverCapacity(1)).toBe(false);
  });
});
