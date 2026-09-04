import type { AllocationsApi, AllocationsSnapshot } from "@baseline/contracts";
import { personMonthLoads } from "@baseline/domain";
import type { SeedData } from "./index";

/** An AllocationsApi over the seed. Never changes, so subscribe has nothing to report. */
export function fixtureAllocationsApi(seed: SeedData): AllocationsApi {
  const snapshot: AllocationsSnapshot = { loads: personMonthLoads(seed.allocations) };
  return {
    snapshot: () => snapshot,
    subscribe: () => () => {},
  };
}
