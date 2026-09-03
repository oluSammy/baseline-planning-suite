import { createSelector } from "@reduxjs/toolkit";
import { rateHistory, type EmployeeId } from "@baseline/domain";

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
