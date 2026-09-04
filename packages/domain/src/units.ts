import { workingDaysInMonth } from "./calendar";
import type { Month, RateRecord, WeeklyHours } from "./model";
import { blendedRate } from "./rates";
import { roundTo } from "./rounding";

// The units the grid can read and edit in.
export type DisplayUnit = "personMonths" | "hours" | "percent" | "cost";

// Display precision
export const UNIT_DECIMALS: Readonly<Record<DisplayUnit, number>> = {
  personMonths: 2,
  hours: 2,
  percent: 1,
  cost: 2,
};

// one person-month = weekly hours × (working days ÷ 5). It varies by
//  person and by month and is never a constant
export function personMonthHours(weeklyHours: WeeklyHours, m: Month): number {
  return (weeklyHours * workingDaysInMonth(m)) / 5;
}

export function personMonthsToHours(pm: number, weeklyHours: WeeklyHours, m: Month): number {
  return pm * personMonthHours(weeklyHours, m);
}

export function hoursToPersonMonths(hours: number, weeklyHours: WeeklyHours, m: Month): number {
  return hours / personMonthHours(weeklyHours, m);
}

// 100% is exactly one person-month of that person in that month.
export function personMonthsToPercent(pm: number): number {
  return pm * 100;
}

export function percentToPersonMonths(percent: number): number {
  return percent / 100;
}

// conversion needs to know about the cell.
export interface ConversionContext {
  readonly month: Month;
  readonly weeklyHours: WeeklyHours | null;
  readonly rateRecords: readonly RateRecord[];
}

function requireWeeklyHours(ctx: ConversionContext): WeeklyHours {
  if (ctx.weeklyHours === null) {
    throw new Error("The People register is unavailable, so hours and cost cannot be converted.");
  }
  return ctx.weeklyHours;
}

// a value typed in `unit` becomes person-months
export function toPersonMonths(value: number, unit: DisplayUnit, ctx: ConversionContext): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Enter a number of zero or more.");
  }
  switch (unit) {
    case "personMonths":
      return value;
    case "percent":
      return percentToPersonMonths(value);
    case "hours":
      return hoursToPersonMonths(value, requireWeeklyHours(ctx), ctx.month);
    case "cost": {
      const rate = blendedRate(ctx.rateRecords, ctx.month);
      if (rate === null) {
        throw new Error("This month has working days with no rate, so a cost cannot be converted.");
      }
      // Strip float noise so the stored value is what a person would write.
      return roundTo(hoursToPersonMonths(value / rate, requireWeeklyHours(ctx), ctx.month), 10);
    }
  }
}

// opposite of toPersonMonths - useful for testing
export function fromPersonMonths(pm: number, unit: DisplayUnit, ctx: ConversionContext): number {
  switch (unit) {
    case "personMonths":
      return pm;
    case "percent":
      return personMonthsToPercent(pm);
    case "hours":
      return personMonthsToHours(pm, requireWeeklyHours(ctx), ctx.month);
    case "cost": {
      const rate = blendedRate(ctx.rateRecords, ctx.month);
      if (rate === null) throw new Error("No blended rate for this month.");
      return personMonthsToHours(pm, requireWeeklyHours(ctx), ctx.month) * rate;
    }
  }
}
