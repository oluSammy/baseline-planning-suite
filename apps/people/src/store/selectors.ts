import { createSelector } from "@reduxjs/toolkit";
import { isOverCapacity, rateHistory, type EmployeeId, type Month } from "@baseline/domain";

import { rateRecordsAdapter } from "./rateRecordsSlice";
import { employeesAdapter } from "./employeesSlice";
import type { RootState } from "./index";

export const { selectAll: selectAllEmployees, selectById: selectEmployeeById } =
  employeesAdapter.getSelectors((state: RootState) => state.employees);

const selectQuery = (_state: RootState, query: string) => query;

export const selectEmployeesMatching = createSelector(
  [selectAllEmployees, selectQuery],
  (employees, query) => {
    const needle = query.trim().toLowerCase();
    if (needle === "") return employees;
    return employees.filter(
      (e) => e.name.toLowerCase().includes(needle) || e.role.toLowerCase().includes(needle),
    );
  },
);

export const { selectAll: selectAllRateRecords } = rateRecordsAdapter.getSelectors(
  (state: RootState) => state.rateRecords,
);

const selectEmployeeIdArg = (_state: RootState, employeeId: EmployeeId) => employeeId;

export const selectRateHistoryFor = createSelector(
  [selectAllRateRecords, selectEmployeeIdArg],
  (records, employeeId) => rateHistory(records.filter((r) => r.employeeId === employeeId)),
);

export const selectCapacityAvailable = (state: RootState) => state.capacity.available;

/** Months in which each employee exceeds one person-month across all projects. */
export const selectOversubscribedMonths = createSelector(
  [(state: RootState) => state.capacity.loads],
  (loads) => {
    const byEmployee = new Map<EmployeeId, { month: Month; total: number }[]>();
    for (const load of loads) {
      if (!isOverCapacity(load.total)) continue;
      byEmployee.set(load.employeeId, [
        ...(byEmployee.get(load.employeeId) ?? []),
        { month: load.month, total: load.total },
      ]);
    }
    for (const months of byEmployee.values()) months.sort((a, b) => a.month.localeCompare(b.month));
    return byEmployee;
  },
);
