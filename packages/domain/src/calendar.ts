import { isoDate, type ISODate } from "./model";

export function addDays(date: ISODate, days: number): ISODate {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);

  return isoDate(shifted.toISOString().slice(0, 10));
}
