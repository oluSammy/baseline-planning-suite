import type { HostContext, HostState } from "@baseline/contracts";
import type { ShellStore } from "./store";

/** The published read-only view of what the shell owns. */
export function createHostContext(store: ShellStore): HostContext {
  const snapshot = (): HostState => store.getState().host;
  return {
    snapshot,
    subscribe(listener) {
      let last = snapshot();
      return store.subscribe(() => {
        const next = snapshot();
        if (next === last) return;
        last = next;
        listener(next);
      });
    },
  };
}
