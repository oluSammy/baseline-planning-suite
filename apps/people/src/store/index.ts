import type { SeedData } from "@baseline/fixtures";
import { configureStore } from "@reduxjs/toolkit";
import { employeesAdapter, employeesReducer } from "./employeesSlice";

export function createPeopleStore(seed: SeedData) {
  return configureStore({
    reducer: {
      employees: employeesReducer,
    },
    preloadedState: {
      employees: employeesAdapter.setAll(employeesAdapter.getInitialState(), seed.employees),
    },
  });
}

export type PeopleStore = ReturnType<typeof createPeopleStore>;
export type RootState = ReturnType<PeopleStore["getState"]>;
export type AppDispatch = PeopleStore["dispatch"];
