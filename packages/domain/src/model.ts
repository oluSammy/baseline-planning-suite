declare const brand: unique symbol;
type Brand<T, Name extends string> = T & { readonly [brand]: Name };

export type EmployeeId = Brand<string, "EmployeeId">;
export type RateRecordId = Brand<string, "RateRecordId">;
export type ProjectId = Brand<string, "ProjectId">;
export type BreakdownItemId = Brand<string, "BreakdownItemId">;
export type AllocationId = Brand<string, "AllocationId">;

// calendar day YYYY-MM-DD
export type ISODate = Brand<string, "ISODate">;

// calendar month YYYY-MM
export type Month = Brand<string, "Month">;

export type PersonMonths = Brand<number, "PersonMonths">;

// cost per hour in Euro
export type HourlyCost = Brand<number, "HourlyCost">;

// Entities

export type WeeklyHours = 40 | 32 | 20;

export interface Employee {
  readonly id: EmployeeId;
  readonly name: string;
  readonly role: string;
  readonly weeklyHours: WeeklyHours;
}

export interface RateRecord {
  readonly id: RateRecordId;
  readonly employeeId: EmployeeId;
  readonly validFrom: ISODate;
  readonly hourlyCost: HourlyCost;
}

export interface Project {
  readonly id: ProjectId;
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
}

export interface BreakdownItem {
  readonly id: BreakdownItemId;
  readonly projectId: ProjectId;
  readonly parentId: BreakdownItemId | null; // parent is null at the root level
  readonly name: string;
}

export interface Allocation {
  readonly id: AllocationId;
  readonly breakdownItemId: BreakdownItemId;
  readonly employeeId: EmployeeId;
  readonly month: Month;
  readonly amount: PersonMonths;
  readonly updatedAt?: string; // ISO timestamp of the last edit. Absent on seeded rows, which count as oldest.
  /** The active user at the time of the last edit, when the host provided one. */
  readonly updatedBy?: EmployeeId;
}

// way to make branded values
export const WEEKLY_HOURS: readonly WeeklyHours[] = [40, 32, 20];

export function isWeeklyHours(value: number): value is WeeklyHours {
  return (WEEKLY_HOURS as readonly number[]).includes(value);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function isRealDay(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

// accepts only a calendar day - YYYY-MM-DD format
export function isoDate(value: string): ISODate {
  if (!ISO_DATE_PATTERN.test(value) || !isRealDay(value)) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return value as ISODate;
}

// accepts YYYY-MM with a month from 01 - 12
export function month(value: string): Month {
  if (!MONTH_PATTERN.test(value) || !isRealDay(`${value}-01`)) {
    throw new Error(`Invalid month: ${value}`);
  }
  return value as Month;
}

export function personMonths(value: number): PersonMonths {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid person-months: ${value}`);
  }
  return value as PersonMonths;
}

export function hourlyCost(value: number): HourlyCost {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid hourly cost: ${value}`);
  }
  return value as HourlyCost;
}
