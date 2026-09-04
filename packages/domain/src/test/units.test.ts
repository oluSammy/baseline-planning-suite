import { describe, expect, it } from "vitest";
import { month } from "../model";
import {
  hoursToPersonMonths,
  percentToPersonMonths,
  personMonthHours,
  personMonthsToHours,
  personMonthsToPercent,
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
