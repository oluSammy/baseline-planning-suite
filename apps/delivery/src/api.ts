import type { AllocationsApi, AllocationsSnapshot } from "@baseline/contracts";
import type { DeliveryStore } from "./store";
import { getDeliveryStore } from "./store/instance";
import { selectPersonMonthLoads } from "./store/selectors";

/** Builds the published read-only view of a Delivery store. */
export function createAllocationsApi(store: DeliveryStore): AllocationsApi {
  const snapshot = (): AllocationsSnapshot => ({ loads: selectPersonMonthLoads(store.getState()) });

  return {
    snapshot,
    subscribe(listener) {
      let last = snapshot();
      return store.subscribe(() => {
        const next = snapshot();
        if (next.loads === last.loads) return;
        last = next;
        listener(next);
      });
    },
  };
}

/** What the shell loads as `delivery/api`. */
export const allocationsApi: AllocationsApi = createAllocationsApi(getDeliveryStore());
