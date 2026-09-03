import { addDays } from "./calendar";
import type { EmployeeId, ISODate, RateRecord, RateRecordId } from "./model";

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
