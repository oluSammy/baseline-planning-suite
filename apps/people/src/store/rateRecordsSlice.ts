import {
  findRateConflict,
  type EmployeeId,
  type HourlyCost,
  type ISODate,
  type RateRecord,
  type RateRecordId,
} from "@baseline/domain";
import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const rateRecordsAdapter = createEntityAdapter<RateRecord, RateRecordId>({
  selectId: (record) => record.id,
});

const { selectAll } = rateRecordsAdapter.getSelectors();

export interface RateInput {
  readonly employeeId: EmployeeId;
  readonly validFrom: ISODate;
  readonly hourlyCost: HourlyCost;
}

export interface RateCorrection {
  readonly id: RateRecordId;
  readonly validFrom: ISODate;
  readonly hourlyCost: HourlyCost;
}

export const rateRecordsSlice = createSlice({
  name: "rateRecords",
  initialState: rateRecordsAdapter.getInitialState(),
  reducers: {
    rateAdded: {
      prepare(input: RateInput) {
        return { payload: { id: crypto.randomUUID() as RateRecordId, ...input } };
      },
      reducer(state, action: PayloadAction<RateRecord>) {
        const { employeeId, validFrom } = action.payload;
        if (findRateConflict(selectAll(state), employeeId, validFrom, null)) return;
        rateRecordsAdapter.addOne(state, action.payload);
      },
    },

    rateCorrected(state, action: PayloadAction<RateCorrection>) {
      const { id, validFrom, hourlyCost } = action.payload;
      const existing = state.entities[id];
      if (!existing) return;
      if (findRateConflict(selectAll(state), existing.employeeId, validFrom, id)) return;
      rateRecordsAdapter.updateOne(state, { id, changes: { validFrom, hourlyCost } });
    },

    rateRemoved(state, action: PayloadAction<RateRecordId>) {
      rateRecordsAdapter.removeOne(state, action.payload);
    },
  },
});

export const { rateAdded, rateCorrected, rateRemoved } = rateRecordsSlice.actions;
export const rateRecordsReducer = rateRecordsSlice.reducer;
