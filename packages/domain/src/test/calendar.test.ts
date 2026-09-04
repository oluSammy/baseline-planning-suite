import { describe, expect, it } from "vitest";
import { month } from "../model";
import { workingDaysInMonth } from "../calendar";

describe("workingDaysInMonth", () => {
  it("counts Monday to Friday, ignoring public holidays", () => {
    expect(workingDaysInMonth(month("2026-03"))).toBe(22); // the brief's reference month
    expect(workingDaysInMonth(month("2026-02"))).toBe(20);
    expect(workingDaysInMonth(month("2026-05"))).toBe(21); // 1 May is a Friday and still counts
    expect(workingDaysInMonth(month("2026-08"))).toBe(21);
  });
});
