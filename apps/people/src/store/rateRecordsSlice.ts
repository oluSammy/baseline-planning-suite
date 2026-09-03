import type { RateRecord, RateRecordId } from "@baseline/domain";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

export const rateRecordsAdapter = createEntityAdapter<RateRecord, RateRecordId>({
  selectId: (record) => record.id,
});

export const rateRecordsSlice = createSlice({
  name: "rateRecords",
  initialState: rateRecordsAdapter.getInitialState(),
  reducers: {},
});

export const rateRecordsReducer = rateRecordsSlice.reducer;
