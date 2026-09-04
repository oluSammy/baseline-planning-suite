import type { HostState } from "@baseline/contracts";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: HostState = { currency: { code: "EUR", perEur: 1 }, activeUser: null };

/**
 * Delivery's read-only copy of what the shell owns. Not owned and not
 * persisted. Filled from the HostContext snapshot at mount, then replaced
 * on every change the shell announces through its subscription.
 */
export const hostSlice = createSlice({
  name: "host",
  initialState,
  reducers: {
    hostSnapshotReceived(_state, action: PayloadAction<HostState>) {
      return action.payload;
    },
  },
});

export const { hostSnapshotReceived } = hostSlice.actions;
export const hostReducer = hostSlice.reducer;
