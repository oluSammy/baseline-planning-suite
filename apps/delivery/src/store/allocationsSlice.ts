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
  readonly updatedBy?: EmployeeId;
}

export const allocationsAdapter = createEntityAdapter<Allocation, AllocationId>({
  selectId: (allocation) => allocation.id,
});

const { selectAll } = allocationsAdapter.getSelectors();

export const allocationsSlice = createSlice({
  name: "allocations",
  initialState: allocationsAdapter.getInitialState(),
  reducers: {
    // Sets one cell. Zero clears it. A cell is one person on one leaf in one month.
    allocationSet: {
      prepare(edit: CellEdit) {
        return {
          payload: {
            id: crypto.randomUUID() as AllocationId,
            updatedAt: new Date().toISOString(),
            ...edit,
          },
        };
      },
      reducer(state, action: PayloadAction<CellEdit & { id: AllocationId; updatedAt: string }>) {
        const { id, itemId, employeeId, month, amount, updatedAt, updatedBy } = action.payload;
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
        const stamp = { updatedAt, ...(updatedBy === undefined ? {} : { updatedBy }) };
        if (first) {
          allocationsAdapter.updateOne(state, { id: first.id, changes: { amount, ...stamp } });
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
          ...stamp,
        });
      },
    },
    allocationsMoved(state, action: PayloadAction<{ from: BreakdownItemId; to: BreakdownItemId }>) {
      const moving = selectAll(state).filter((a) => a.breakdownItemId === action.payload.from);
      allocationsAdapter.updateMany(
        state,
        moving.map((a) => ({ id: a.id, changes: { breakdownItemId: action.payload.to } })),
      );
    },
    allocationsRemovedForItems(state, action: PayloadAction<readonly BreakdownItemId[]>) {
      const doomed = new Set(action.payload);
      allocationsAdapter.removeMany(
        state,
        selectAll(state)
          .filter((a) => doomed.has(a.breakdownItemId))
          .map((a) => a.id),
      );
    },
  },
});

export const allocationsReducer = allocationsSlice.reducer;
export const { allocationSet, allocationsMoved, allocationsRemovedForItems } =
  allocationsSlice.actions;
