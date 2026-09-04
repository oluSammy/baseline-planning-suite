import { describe, expect, it } from "vitest";
import {
  hourlyCost,
  isoDate,
  month,
  type EmployeeId,
  type RateRecord,
  type RateRecordId,
} from "../model";
import { priceAllocation } from "../pricing";
import { roundTo } from "../rounding";
import { personMonthsToPercent } from "../units";

const employeeId = "emp-001" as EmployeeId;
const rate = (id: string, validFrom: string, cost: number): RateRecord => ({
  id: id as RateRecordId,
  employeeId,
  validFrom: isoDate(validFrom),
  hourlyCost: hourlyCost(cost),
});

// 40 h/week, €80 from 2025-01-01, €95 from 2026-03-12, 0.50 PM in March 2026.
describe("reference calculation", () => {
  const pricing = priceAllocation({
    personMonths: 0.5,
    month: month("2026-03"),
    weeklyHours: 40,
    rateRecords: [rate("rate-001", "2025-01-01", 80), rate("rate-002", "2026-03-12", 95)],
  });

  it("March 2026 has 22 working days, 8 before the 12th and 14 from it", () => {
    expect(pricing.workingDays).toBe(22);
    expect(pricing.slices.map((s) => s.workingDays)).toEqual([8, 14]);
  });

  it("one person-month is 176.00 h, the allocation 88.00 h, 4.00 h per working day", () => {
    expect(pricing.personMonthHours).toBe(176);
    expect(pricing.hours).toBe(88);
    expect(pricing.hoursPerWorkingDay).toBe(4);
  });

  it("costs 8×4×80 + 14×4×95 = 2,560 + 5,320 = €7,880.00", () => {
    expect(pricing.slices.map((s) => s.cost)).toEqual([2560, 5320]);
    expect(pricing.cost).toBe(7880);
  });

  it("is 50.0% of capacity with an implied blended rate of €89.5455/h", () => {
    expect(personMonthsToPercent(0.5)).toBe(50);
    expect(roundTo(pricing.blendedRate ?? 0, 4)).toBe(89.5455);
  });
});

describe("priceAllocation edge cases", () => {
  it("prices a month before the first rate at zero and marks it", () => {
    const pricing = priceAllocation({
      personMonths: 1,
      month: month("2024-12"),
      weeklyHours: 40,
      rateRecords: [rate("r1", "2025-01-01", 80)],
    });
    expect(pricing.cost).toBe(0);
    expect(pricing.unpricedDays).toBe(22);
    expect(pricing.blendedRate).toBeNull();
  });

  it("prices only the days from the first rate when it starts mid-month", () => {
    const pricing = priceAllocation({
      personMonths: 0.5,
      month: month("2026-03"),
      weeklyHours: 40,
      rateRecords: [rate("r2", "2026-03-12", 95)],
    });
    expect(pricing.cost).toBe(14 * 4 * 95);
    expect(pricing.unpricedDays).toBe(8);
  });
});
