import type { PeopleApi, PeopleSnapshot } from "@baseline/contracts";
import type { SeedData } from "./index";

// A PeopleApi over the seed. Never changes, so subscribe has nothing to report
export function fixturePeopleApi(seed: SeedData): PeopleApi {
  const snapshot: PeopleSnapshot = {
    employees: seed.employees,
    rateRecords: seed.rateRecords,
  };
  return {
    snapshot: () => snapshot,
    subscribe: () => () => {},
  };
}
