import { describe, expect, it } from "vitest";
import { hourlyCost, isoDate, type EmployeeId, type RateRecord, type RateRecordId } from "../model";
import { rateHistory, findRateConflict } from "../rates";

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
