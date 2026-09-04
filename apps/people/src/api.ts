import type { PeopleApi, PeopleSnapshot } from "@baseline/contracts";
import type { PeopleStore } from "./store";
import { getPeopleStore } from "./store/instance";
import { selectAllEmployees, selectAllRateRecords } from "./store/selectors";

/** Builds the published read-only view of a People store. */
export function createPeopleApi(store: PeopleStore): PeopleApi {
  const snapshot = (): PeopleSnapshot => {
    const state = store.getState();
    return { employees: selectAllEmployees(state), rateRecords: selectAllRateRecords(state) };
  };

  return {
    snapshot,
    subscribe(listener) {
      let last = snapshot();
      return store.subscribe(() => {
        const next = snapshot();
        if (next.employees === last.employees && next.rateRecords === last.rateRecords) return;
        last = next;
        listener(next);
      });
    },
  };
}

/** What the shell loads as `people/api`. */
export const peopleApi: PeopleApi = createPeopleApi(getPeopleStore());
