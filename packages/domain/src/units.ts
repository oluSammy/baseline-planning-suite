import { workingDaysInMonth } from "./calendar";
import type { Month, WeeklyHours } from "./model";

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
