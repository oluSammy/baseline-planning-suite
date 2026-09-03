import { addDays } from "./calendar";
import type { ISODate, RateRecord } from "./model";

// One rate and the period it covers. `validTo` is the last day, inclusive; null means open-ended.
export interface RatePeriod {
  readonly record: RateRecord;
  readonly validTo: ISODate | null;
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
