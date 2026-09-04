import { workingDaysInMonth } from "./calendar";
import type { Month, RateRecord, WeeklyHours } from "./model";
import { rateSlices, type RateSlice } from "./rates";
import { personMonthsToHours } from "./units";

export interface PricedSlice extends RateSlice {
  readonly cost: number;
}

// reference calculation shows, for one cell.
export interface CellPricing {
  readonly workingDays: number;
  readonly personMonthHours: number;
  readonly hours: number;
  readonly hoursPerWorkingDay: number;
  readonly slices: readonly PricedSlice[];
  readonly cost: number;
  // Working days with no rate, priced at zero. The cell is marked when this is above zero.
  readonly unpricedDays: number;
  // cost ÷ hours. Null when there are no hours or any day is unpriced
  readonly blendedRate: number | null;
}

export interface PricingInput {
  readonly personMonths: number;
  readonly month: Month;
  readonly weeklyHours: WeeklyHours;
  readonly rateRecords: readonly RateRecord[];
}

// effort is spread evenly over the month's working days, and each
// working day is priced at the rate in effect that day
export function priceAllocation({
  personMonths,
  month,
  weeklyHours,
  rateRecords,
}: PricingInput): CellPricing {
  const workingDays = workingDaysInMonth(month);
  const hours = personMonthsToHours(personMonths, weeklyHours, month);
  const hoursPerWorkingDay = workingDays === 0 ? 0 : hours / workingDays;

  const slices = rateSlices(rateRecords, month).map((slice) => ({
    ...slice,
    cost: slice.hourlyCost === null ? 0 : slice.workingDays * hoursPerWorkingDay * slice.hourlyCost,
  }));

  const cost = slices.reduce((acc, slice) => acc + slice.cost, 0);
  const unpricedDays = slices
    .filter((slice) => slice.hourlyCost === null)
    .reduce((acc, slice) => acc + slice.workingDays, 0);

  return {
    workingDays,
    personMonthHours: personMonthsToHours(1, weeklyHours, month),
    hours,
    hoursPerWorkingDay,
    slices,
    cost,
    unpricedDays,
    blendedRate: hours > 0 && unpricedDays === 0 ? cost / hours : null,
  };
}
