import type { PeopleSnapshot } from "@baseline/contracts";
import type { Employee, EmployeeId, RateRecord, RateRecordId } from "@baseline/domain";
import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const employeesAdapter = createEntityAdapter<Employee, EmployeeId>({
  selectId: (employee) => employee.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export const rateRecordsAdapter = createEntityAdapter<RateRecord, RateRecordId>({
  selectId: (record) => record.id,
});

// Delivery's read-only copy of what People publishes
// updates on mount and also when subscription gets a snapshot
export const peopleSlice = createSlice({
  name: "people",
  initialState: {
    available: false,
    employees: employeesAdapter.getInitialState(),
    rateRecords: rateRecordsAdapter.getInitialState(),
  },
  reducers: {
    peopleSnapshotReceived(state, action: PayloadAction<PeopleSnapshot>) {
      state.available = true;
      employeesAdapter.setAll(state.employees, action.payload.employees);
      rateRecordsAdapter.setAll(state.rateRecords, action.payload.rateRecords);
    },
  },
});

export const { peopleSnapshotReceived } = peopleSlice.actions;
export const peopleReducer = peopleSlice.reducer;
