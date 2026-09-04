import type {
  Allocation,
  AllocationId,
  BreakdownItemId,
  EmployeeId,
  Month,
  PersonMonths,
} from "@baseline/domain";
import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CellEdit {
  readonly itemId: BreakdownItemId;
  readonly employeeId: EmployeeId;
  readonly month: Month;
  readonly amount: PersonMonths;
}

export const allocationsAdapter = createEntityAdapter<Allocation, AllocationId>({
  selectId: (allocation) => allocation.id,
});

export const allocationsSlice = createSlice({
  name: "allocations",
  initialState: allocationsAdapter.getInitialState(),
  reducers: {
    // Sets one cell. Zero clears it. A cell is one person on one leaf in one month.
    allocationSet: {
      prepare(edit: CellEdit) {
        return { payload: { id: crypto.randomUUID() as AllocationId, ...edit } };
      },
      reducer(state, action: PayloadAction<CellEdit & { id: AllocationId }>) {
        const { id, itemId, employeeId, month, amount } = action.payload;
        const { selectAll } = allocationsAdapter.getSelectors();
        const existing = selectAll(state).filter(
          (a) => a.breakdownItemId === itemId && a.employeeId === employeeId && a.month === month,
        );

        if (amount === 0) {
          allocationsAdapter.removeMany(
            state,
            existing.map((a) => a.id),
          );
          return;
        }
        const [first, ...duplicates] = existing;
        if (first) {
          allocationsAdapter.updateOne(state, { id: first.id, changes: { amount } });
          allocationsAdapter.removeMany(
            state,
            duplicates.map((a) => a.id),
          );
          return;
        }
        allocationsAdapter.addOne(state, {
          id,
          breakdownItemId: itemId,
          employeeId,
          month,
          amount,
        });
      },
    },
  },
});

export const allocationsReducer = allocationsSlice.reducer;
export const { allocationSet } = allocationsSlice.actions;
