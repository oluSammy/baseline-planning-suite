export interface PersistenceAdapter<T> {
  load(): T | null; // Returns the saved state, or null when nothing valid is saved
  save(state: T): void;
  clear(): void;
}

export function localStorageAdapter<T>(
  key: string,
  isValid: (value: unknown) => value is T,
): PersistenceAdapter<T> {
  return {
    // load previous data from the local storage if any or return null
    load() {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    // add data to the localstorage
    save(state) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`persistence: could not save ${key}`, error);
      }
    },
    clear() {
      window.localStorage.removeItem(key);
    },
  };
}

// In-memory adapter for tests and for environments without storage.
export function memoryAdapter<T>(initial: T | null = null): PersistenceAdapter<T> {
  let saved = initial;
  return {
    load: () => saved,
    save: (state) => {
      saved = state;
    },
    clear: () => {
      saved = null;
    },
  };
}
