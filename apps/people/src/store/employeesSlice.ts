import type { Employee, EmployeeId } from "@baseline/domain";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

export const employeesAdapter = createEntityAdapter<Employee, EmployeeId>({
  selectId: (employee) => employee.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export const employeesSlice = createSlice({
  name: "employees",
  initialState: employeesAdapter.getInitialState(),
  reducers: {},
});

export const employeesReducer = employeesSlice.reducer;
