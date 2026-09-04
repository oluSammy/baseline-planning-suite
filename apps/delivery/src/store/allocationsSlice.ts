import type { Allocation, AllocationId } from "@baseline/domain";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

export const allocationsAdapter = createEntityAdapter<Allocation, AllocationId>({
  selectId: (allocation) => allocation.id,
});

export const allocationsSlice = createSlice({
  name: "allocations",
  initialState: allocationsAdapter.getInitialState(),
  reducers: {},
});

export const allocationsReducer = allocationsSlice.reducer;
