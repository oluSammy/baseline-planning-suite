import { isoDate, month, type ISODate, type Month } from "./model";

// The month a day falls in
export function monthOf(date: ISODate): Month {
  return month(date.slice(0, 7));
}

export function addDays(date: ISODate, days: number): ISODate {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);

  return isoDate(shifted.toISOString().slice(0, 10));
}

// Every month from `from` to `to`, inclusive. Empty when `to` is before `from`.
export function monthsBetween(from: Month, to: Month): Month[] {
  const result: Month[] = [];
  let [year, mon] = from.split("-").map(Number) as [number, number];
  while (true) {
    const current = month(`${year}-${String(mon).padStart(2, "0")}`);
    if (current > to) break;
    result.push(current);
    mon += 1;
    if (mon === 13) {
      mon = 1;
      year += 1;
    }
  }
  return result;
}
