import { localStorageAdapter } from "@baseline/persistence";
import { createShellStore, isPersistedState, type ShellStore } from "./index";

const STORAGE_KEY = "baseline.shell.v1";

let instance: ShellStore | null = null;

export function getShellStore(): ShellStore {
  instance ??= createShellStore({
    persistence: localStorageAdapter(STORAGE_KEY, isPersistedState),
  });
  return instance;
}
