import type { Employee, EmployeeId, PersonMonthLoad, RateRecord } from "@baseline/domain";

// Contracts between the three Baseline apps. Types and names only.
// so that the apps depend on this package and never on each other

export type RemoteName = "people" | "delivery";

// What People publishes. Read-only: consumers can look and listen
export interface PeopleSnapshot {
  readonly employees: readonly Employee[];
  readonly rateRecords: readonly RateRecord[];
}

export interface PeopleApi {
  snapshot(): PeopleSnapshot; // current state of the register
  subscribe(listener: (snapshot: PeopleSnapshot) => void): () => void; // can be called after every change in People. Returns a function that unsubscribes
}

// Every remote exposes `./mount` with this shape. The host renders the
// remote into `container` and receives a function that tears it down
export type MountFn = (container: HTMLElement, context?: MountContext) => () => void;

// The module a remote exposes at `./mount`
export interface MountModule {
  readonly mount: MountFn;
}

/** What Delivery publishes: per person-month totals across all projects. Never its work breakdown. */
export interface AllocationsSnapshot {
  readonly loads: readonly PersonMonthLoad[];
}

export interface AllocationsApi {
  snapshot(): AllocationsSnapshot;
  subscribe(listener: (snapshot: AllocationsSnapshot) => void): () => void;
}

/** The module People exposes at `./api`. */
export interface PeopleApiModule {
  readonly peopleApi: PeopleApi;
}

/** The module Delivery exposes at `./api`. */
export interface AllocationsApiModule {
  readonly allocationsApi: AllocationsApi;
}

/** A display currency. Rates and costs are stored in EUR; this only changes what is shown. */
export interface DisplayCurrency {
  readonly code: string;
  /** How many units of this currency one euro buys. 1 for EUR itself. */
  readonly perEur: number;
}

/** What the shell owns and pushes into every remote. */
export interface HostState {
  readonly currency: DisplayCurrency;
  readonly activeUser: EmployeeId | null;
}

export interface HostContext {
  snapshot(): HostState;
  subscribe(listener: (state: HostState) => void): () => void;
}

export interface MountContext {
  readonly people?: PeopleApi;
  readonly allocations?: AllocationsApi;
  readonly host?: HostContext;
}
