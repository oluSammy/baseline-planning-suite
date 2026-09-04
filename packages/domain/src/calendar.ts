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

export function workingDaysInMonth(m: Month): number {
  const [year, mon] = m.split("-").map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

// Working days from `from` to `to`, both inclusive. Zero when `to` is before `from`
export function workingDaysBetween(from: ISODate, to: ISODate): number {
  let count = 0;
  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

// First and last calendar day of a month.
export function monthBounds(m: Month): { readonly first: ISODate; readonly last: ISODate } {
  const [year, mon] = m.split("-").map(Number) as [number, number];
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  return {
    first: isoDate(`${m}-01`),
    last: isoDate(`${m}-${String(lastDay).padStart(2, "0")}`),
  };
}
