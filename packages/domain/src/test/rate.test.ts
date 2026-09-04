import { describe, expect, it } from "vitest";
import {
  hourlyCost,
  isoDate,
  type EmployeeId,
  type RateRecord,
  type RateRecordId,
  month,
} from "../model";
import { rateHistory, findRateConflict, rateSlices, blendedRate } from "../rates";
import { roundTo } from "../rounding";

const employeeId = "emp-001" as EmployeeId;

function rate(id: string, validFrom: string, cost: number): RateRecord {
  return {
    id: id as RateRecordId,
    employeeId,
    validFrom: isoDate(validFrom),
    hourlyCost: hourlyCost(cost),
  };
}

describe("rateHistory", () => {
  it("ends each rate the day before the next begins and leaves the last open", () => {
    const periods = rateHistory([rate("r2", "2026-03-12", 95), rate("r1", "2025-01-01", 80)]);

    expect(periods.map((p) => [p.record.hourlyCost, p.validTo])).toEqual([
      [80, "2026-03-11"],
      [95, null],
    ]);
  });

  it("handles a single record", () => {
    expect(rateHistory([rate("r1", "2025-01-01", 80)])).toEqual([
      { record: rate("r1", "2025-01-01", 80), validTo: null },
    ]);
  });

  it("handles no records", () => {
    expect(rateHistory([])).toEqual([]);
  });
});

describe("findRateConflict", () => {
  const records = [rate("r1", "2025-01-01", 80), rate("r2", "2026-03-12", 95)];

  it("finds a record starting on the same day for the same employee", () => {
    expect(findRateConflict(records, employeeId, isoDate("2026-03-12"), null)?.id).toBe("r2");
  });

  it("ignores the record being corrected", () => {
    expect(
      findRateConflict(records, employeeId, isoDate("2026-03-12"), "r2" as RateRecordId),
    ).toBeUndefined();
  });

  it("allows a retroactive date nobody uses", () => {
    expect(findRateConflict(records, employeeId, isoDate("2024-06-01"), null)).toBeUndefined();
  });
});

describe("rateSlices", () => {
  const okafor = [rate("r1", "2025-01-01", 80), rate("r2", "2026-03-12", 95)];

  it("splits a month at a mid-month change, validFrom inclusive", () => {
    expect(rateSlices(okafor, month("2026-03"))).toEqual([
      { from: "2026-03-01", to: "2026-03-11", workingDays: 8, hourlyCost: 80 },
      { from: "2026-03-12", to: "2026-03-31", workingDays: 14, hourlyCost: 95 },
    ]);
  });

  it("gives one slice when no change falls in the month", () => {
    expect(rateSlices(okafor, month("2026-04"))).toEqual([
      { from: "2026-04-01", to: "2026-04-30", workingDays: 22, hourlyCost: 95 },
    ]);
  });

  it("marks days before the first record as unpriced", () => {
    expect(rateSlices(okafor, month("2024-12"))).toEqual([
      { from: "2024-12-01", to: "2024-12-31", workingDays: 22, hourlyCost: null },
    ]);
    expect(rateSlices([], month("2026-03"))[0]?.hourlyCost).toBeNull();
  });

  it("yields three slices for two changes in one month", () => {
    const busy = [...okafor, rate("r3", "2026-03-25", 100)];
    expect(rateSlices(busy, month("2026-03")).map((s) => [s.workingDays, s.hourlyCost])).toEqual([
      [8, 80],
      [9, 95],
      [5, 100],
    ]);
  });
});

describe("blendedRate", () => {
  const okafor = [rate("r1", "2025-01-01", 80), rate("r2", "2026-03-12", 95)];

  it("weights each rate by its working days", () => {
    expect(roundTo(blendedRate(okafor, month("2026-03")) ?? 0, 4)).toBe(89.5455); // (8×80 + 14×95) ÷ 22
    expect(blendedRate(okafor, month("2026-04"))).toBe(95);
    expect(blendedRate(okafor, month("2024-12"))).toBeNull();
  });
});
