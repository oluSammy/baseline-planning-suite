import {
  hourlyCost,
  isWeeklyHours,
  isoDate,
  month,
  personMonths,
  type Allocation,
  type AllocationId,
  type BreakdownItem,
  type BreakdownItemId,
  type Employee,
  type EmployeeId,
  type Month,
  type Project,
  type ProjectId,
  type RateRecord,
  type RateRecordId,
} from "@baseline/domain";

import seedJson from "./baseline-seed.json";
export interface SeedData {
  readonly employees: readonly Employee[];
  readonly rateRecords: readonly RateRecord[];
  readonly projects: readonly Project[];
  readonly breakdownItems: readonly BreakdownItem[];
  readonly allocations: readonly Allocation[];
  readonly horizon: { readonly from: Month; readonly to: Month }; // Default month range the grid opens on.
}

export function loadSeed(): SeedData {
  return {
    employees: seedJson.employees.map((row) => {
      if (!isWeeklyHours(row.weeklyHours)) {
        throw new Error(`Employee ${row.id}: weeklyHours must be 40, 32 or 20`);
      }

      return {
        id: row.id as EmployeeId,
        name: row.name,
        role: row.role,
        weeklyHours: row.weeklyHours,
      };
    }),
    rateRecords: seedJson.rateRecords.map((row) => ({
      id: row.id as RateRecordId,
      employeeId: row.employeeId as EmployeeId,
      validFrom: isoDate(row.validFrom),
      hourlyCost: hourlyCost(row.hourlyCost),
    })),
    projects: seedJson.projects.map((row) => ({
      id: row.id as ProjectId,
      name: row.name,
      startDate: isoDate(row.startDate),
      endDate: isoDate(row.endDate),
    })),
    breakdownItems: seedJson.breakdownItems.map((row) => ({
      id: row.id as BreakdownItemId,
      projectId: row.projectId as ProjectId,
      parentId: row.parentId as BreakdownItemId | null,
      name: row.name,
    })),

    allocations: seedJson.allocations.map((row) => ({
      id: row.id as AllocationId,
      breakdownItemId: row.breakdownItemId as BreakdownItemId,
      employeeId: row.employeeId as EmployeeId,
      month: month(row.month),
      amount: personMonths(row.amount),
    })),

    horizon: {
      from: month(seedJson.meta.gridHorizon.from),
      to: month(seedJson.meta.gridHorizon.to),
    },
  };
}

export * from "./peopleApi";
export * from "./allocationsApi";
