import type { Employee, PersonMonthLoad, RateRecord } from "@baseline/domain";

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

export interface MountContext {
  readonly people?: PeopleApi;
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

export interface MountContext {
  readonly people?: PeopleApi;
  readonly allocations?: AllocationsApi;
}

/** The module People exposes at `./api`. */
export interface PeopleApiModule {
  readonly peopleApi: PeopleApi;
}

/** The module Delivery exposes at `./api`. */
export interface AllocationsApiModule {
  readonly allocationsApi: AllocationsApi;
}
