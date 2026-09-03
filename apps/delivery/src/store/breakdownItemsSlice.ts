import type { BreakdownItem, BreakdownItemId } from "@baseline/domain";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

export const breakdownItemsAdapter = createEntityAdapter<BreakdownItem, BreakdownItemId>({
  selectId: (item) => item.id,
});

export const breakdownItemsSlice = createSlice({
  name: "breakdownItems",
  initialState: breakdownItemsAdapter.getInitialState(),
  reducers: {},
});

export const breakdownItemsReducer = breakdownItemsSlice.reducer;
