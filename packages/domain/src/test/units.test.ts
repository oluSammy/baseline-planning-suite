import { describe, expect, it } from "vitest";
import {
  hourlyCost,
  isoDate,
  month,
  type EmployeeId,
  type RateRecord,
  type RateRecordId,
} from "../model";
import {
  fromPersonMonths,
  hoursToPersonMonths,
  percentToPersonMonths,
  personMonthHours,
  personMonthsToHours,
  personMonthsToPercent,
  toPersonMonths,
  type ConversionContext,
} from "../units";

const march = month("2026-03");

describe("units", () => {
  it("derives one person-month from weekly hours and working days", () => {
    expect(personMonthHours(40, march)).toBe(176);
    expect(personMonthHours(32, march)).toBe(140.8);
    expect(personMonthHours(20, march)).toBe(88);
    expect(personMonthHours(40, month("2026-02"))).toBe(160);
  });

  it("matches the reference calculation for 0.50 person-months", () => {
    expect(personMonthsToHours(0.5, 40, march)).toBe(88);
    expect(personMonthsToPercent(0.5)).toBe(50);
  });

  it("round-trips without loss", () => {
    for (const pm of [0, 0.25, 0.5, 0.59, 1, 1.18]) {
      expect(hoursToPersonMonths(personMonthsToHours(pm, 32, march), 32, march)).toBeCloseTo(
        pm,
        12,
      );
      expect(percentToPersonMonths(personMonthsToPercent(pm))).toBeCloseTo(pm, 12);
    }
  });
});

describe("toPersonMonths", () => {
  const okafor: RateRecord[] = [
    {
      id: "r1" as RateRecordId,
      employeeId: "e" as EmployeeId,
      validFrom: isoDate("2025-01-01"),
      hourlyCost: hourlyCost(80),
    },
    {
      id: "r2" as RateRecordId,
      employeeId: "e" as EmployeeId,
      validFrom: isoDate("2026-03-12"),
      hourlyCost: hourlyCost(95),
    },
  ];
  const ctx: ConversionContext = { month: march, weeklyHours: 40, rateRecords: okafor };

  it("converts the reference cell from every unit back to 0.50", () => {
    expect(toPersonMonths(0.5, "personMonths", ctx)).toBe(0.5);
    expect(toPersonMonths(50, "percent", ctx)).toBe(0.5);
    expect(toPersonMonths(88, "hours", ctx)).toBe(0.5);
    expect(toPersonMonths(7880, "cost", ctx)).toBe(0.5);
  });

  it("round-trips every unit", () => {
    for (const unit of ["personMonths", "hours", "percent", "cost"] as const) {
      expect(toPersonMonths(fromPersonMonths(0.59, unit, ctx), unit, ctx)).toBeCloseTo(0.59, 9);
    }
  });

  it("refuses what it cannot convert, with a reason", () => {
    expect(() => toPersonMonths(-1, "personMonths", ctx)).toThrow(/zero or more/);
    expect(() => toPersonMonths(10, "hours", { ...ctx, weeklyHours: null })).toThrow(/unavailable/);
    expect(() => toPersonMonths(100, "cost", { ...ctx, rateRecords: [] })).toThrow(/no rate/);
  });
});
