import { memoryAdapter } from "@baseline/persistence";
import type { EmployeeId } from "@baseline/domain";
import { describe, expect, it, vi } from "vitest";
import { createHostContext } from "../hostContext";
import { createShellStore, type PersistedState } from "../store";
import { activeUserChanged, CURRENCIES, currencyChanged } from "../store/hostSlice";

describe("shell store", () => {
  it("starts on EUR with nobody active, and persists changes", () => {
    const adapter = memoryAdapter<PersistedState>();
    const store = createShellStore({ persistence: adapter });
    expect(store.getState().host).toEqual({
      currency: { code: "EUR", perEur: 1 },
      activeUser: null,
    });

    store.dispatch(currencyChanged(CURRENCIES[1] ?? { code: "USD", perEur: 1.08 }));
    expect(adapter.load()?.host.currency.code).toBe("USD");
  });

  it("publishes a host context that notifies on change only", () => {
    const store = createShellStore({ persistence: memoryAdapter() });
    const listener = vi.fn();
    createHostContext(store).subscribe(listener);

    store.dispatch(activeUserChanged("emp-001" as EmployeeId));
    store.dispatch({ type: "unrelated" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].activeUser).toBe("emp-001");
  });
});
