import type { DisplayCurrency, HostState } from "@baseline/contracts";
import type { EmployeeId } from "@baseline/domain";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const CURRENCIES: readonly DisplayCurrency[] = [
  { code: "EUR", perEur: 1 },
  { code: "USD", perEur: 1.08 },
  { code: "GBP", perEur: 0.86 },
];

const initialState: HostState = {
  currency: CURRENCIES[0] ?? { code: "EUR", perEur: 1 },
  activeUser: null,
};

export const hostSlice = createSlice({
  name: "host",
  initialState,
  reducers: {
    currencyChanged(state, action: PayloadAction<DisplayCurrency>) {
      state.currency = action.payload;
    },
    activeUserChanged(state, action: PayloadAction<EmployeeId | null>) {
      state.activeUser = action.payload;
    },
  },
});
export const { currencyChanged, activeUserChanged } = hostSlice.actions;
export const hostReducer = hostSlice.reducer;
