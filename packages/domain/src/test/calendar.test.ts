import { describe, expect, it } from "vitest";
import { month, isoDate } from "../model";
import { workingDaysInMonth, monthBounds, workingDaysBetween } from "../calendar";

describe("workingDaysInMonth", () => {
  it("counts Monday to Friday, ignoring public holidays", () => {
    expect(workingDaysInMonth(month("2026-03"))).toBe(22);
    expect(workingDaysInMonth(month("2026-02"))).toBe(20);
    expect(workingDaysInMonth(month("2026-05"))).toBe(21); // 1 May is a Friday and still counts
    expect(workingDaysInMonth(month("2026-08"))).toBe(21);
  });
});

describe("workingDaysBetween", () => {
  it("splits March 2026 at the 12th into 8 and 14, validFrom inclusive", () => {
    expect(workingDaysBetween(isoDate("2026-03-01"), isoDate("2026-03-11"))).toBe(8);
    expect(workingDaysBetween(isoDate("2026-03-12"), isoDate("2026-03-31"))).toBe(14);
  });

  it("returns zero for an empty or reversed range", () => {
    expect(workingDaysBetween(isoDate("2026-03-14"), isoDate("2026-03-15"))).toBe(0); // weekend
    expect(workingDaysBetween(isoDate("2026-03-10"), isoDate("2026-03-09"))).toBe(0);
  });
});

describe("monthBounds", () => {
  it("knows month lengths", () => {
    expect(monthBounds(month("2026-02"))).toEqual({ first: "2026-02-01", last: "2026-02-28" });
    expect(monthBounds(month("2028-02")).last).toBe("2028-02-29");
  });
});
