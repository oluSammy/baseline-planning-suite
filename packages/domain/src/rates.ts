import { addDays, monthBounds, workingDaysBetween } from "./calendar";
import type { EmployeeId, ISODate, RateRecord, RateRecordId } from "./model";
import type { HourlyCost, Month } from "./model";

// One rate and the period it covers. `validTo` is the last day, inclusive; null means open-ended.
export interface RatePeriod {
  readonly record: RateRecord;
  readonly validTo: ISODate | null;
}

export interface RateSlice {
  readonly from: ISODate;
  readonly to: ISODate;
  readonly workingDays: number;
  readonly hourlyCost: HourlyCost | null;
}

// Sorts records by start date. ISO dates sort correctly as strings
export function sortByValidFrom(records: readonly RateRecord[]): RateRecord[] {
  return [...records].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
}

// a rate applies from its validFrom (inclusive) until the next record begins
// The last record has no end
export function rateHistory(records: readonly RateRecord[]): RatePeriod[] {
  const sorted = sortByValidFrom(records);
  return sorted.map((record, index) => {
    const next = sorted[index + 1];
    return {
      record,
      validTo: next === undefined ? null : addDays(next.validFrom, -1),
    };
  });
}

// Two rates for one employee cannot start on the same day, because a day
// can only be priced at one rate. Returns the clashing record, if any.
// `excludeId` lets a correction ignore the record being corrected.
export function findRateConflict(
  records: readonly RateRecord[],
  employeeId: EmployeeId,
  validFrom: ISODate,
  excludeId: RateRecordId | null,
): RateRecord | undefined {
  return records.find(
    (r) => r.employeeId === employeeId && r.validFrom === validFrom && r.id !== excludeId,
  );
}

// partitions a month's working days by the rate in effect on each day.
// One change in the month gives two slices; more changes give more. Days
// before the employee's first record form an unpriced slice.
export function rateSlices(records: readonly RateRecord[], m: Month): RateSlice[] {
  const { first, last } = monthBounds(m);
  const periods = rateHistory(records);
  const slices: RateSlice[] = [];

  const firstStart = periods[0]?.record.validFrom;
  if (firstStart === undefined || firstStart > first) {
    const to = firstStart === undefined ? last : addDays(firstStart, -1);
    const end = to < last ? to : last;
    slices.push({
      from: first,
      to: end,
      workingDays: workingDaysBetween(first, end),
      hourlyCost: null,
    });
  }

  for (const { record, validTo } of periods) {
    const from = record.validFrom > first ? record.validFrom : first;
    const to = validTo === null || validTo > last ? last : validTo;
    if (from > to) continue;
    slices.push({
      from,
      to,
      workingDays: workingDaysBetween(from, to),
      hourlyCost: record.hourlyCost,
    });
  }

  return slices.filter((slice) => slice.workingDays > 0);
}

export function blendedRate(records: readonly RateRecord[], m: Month): number | null {
  const slices = rateSlices(records, m);
  const days = slices.reduce((acc, s) => acc + s.workingDays, 0);
  if (days === 0 || slices.some((s) => s.hourlyCost === null)) return null;
  return slices.reduce((acc, s) => acc + s.workingDays * (s.hourlyCost ?? 0), 0) / days;
}
