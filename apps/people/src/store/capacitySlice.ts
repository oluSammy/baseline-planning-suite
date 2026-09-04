import type { AllocationsSnapshot } from "@baseline/contracts";
import type { PersonMonthLoad } from "@baseline/domain";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CapacityState {
  readonly available: boolean;
  readonly loads: readonly PersonMonthLoad[];
}

const initialState: CapacityState = { available: false, loads: [] };

/**
 * People's read-only copy of what Delivery publishes. Not owned and not
 * persisted. Filled from the AllocationsApi snapshot at mount, then replaced
 * on every change Delivery announces through its subscription.
 */
export const capacitySlice = createSlice({
  name: "capacity",
  initialState,
  reducers: {
    allocationsSnapshotReceived(_state, action: PayloadAction<AllocationsSnapshot>) {
      return { available: true, loads: action.payload.loads };
    },
  },
});

export const { allocationsSnapshotReceived } = capacitySlice.actions;
export const capacityReducer = capacitySlice.reducer;
