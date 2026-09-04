import type { Allocation, EmployeeId, Month } from "./model";

const EPSILON = 1e-9;

export interface CapacityFlag {
  readonly employeeId: EmployeeId;
  readonly month: Month;
  /** Person-months summed across every project. */
  readonly total: number;
  /** The most recently edited allocation contributing to this person-month. */
  readonly culprit: Allocation;
}

/** Total person-months for one person in one month, across every project. */
export interface PersonMonthLoad {
  readonly employeeId: EmployeeId;
  readonly month: Month;
  readonly total: number;
}

/** R5: one person-month is 100%. Anything above, beyond float noise, is over. */
export function isOverCapacity(total: number): boolean {
  return total > 1 + EPSILON;
}

/** Sums allocations per person-month. The shape Delivery publishes to People. */
export function personMonthLoads(allocations: readonly Allocation[]): PersonMonthLoad[] {
  const totals = new Map<string, PersonMonthLoad>();
  for (const a of allocations) {
    const key = capacityKey(a.employeeId, a.month);
    const existing = totals.get(key);
    totals.set(key, {
      employeeId: a.employeeId,
      month: a.month,
      total: (existing?.total ?? 0) + a.amount,
    });
  }
  return [...totals.values()];
}

export function capacityKey(employeeId: EmployeeId, month: Month): string {
  return `${employeeId}|${month}`;
}

export function overCapacity(
  allocations: readonly Allocation[],
): ReadonlyMap<string, CapacityFlag> {
  const groups = new Map<string, { total: number; culprit: Allocation }>();

  for (const allocation of allocations) {
    const key = capacityKey(allocation.employeeId, allocation.month);
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { total: allocation.amount, culprit: allocation });
      continue;
    }
    group.total += allocation.amount;
    if ((allocation.updatedAt ?? "") >= (group.culprit.updatedAt ?? "")) {
      group.culprit = allocation;
    }
  }

  const flags = new Map<string, CapacityFlag>();
  for (const [key, { total, culprit }] of groups) {
    if (isOverCapacity(total)) {
      flags.set(key, { employeeId: culprit.employeeId, month: culprit.month, total, culprit });
    }
  }
  return flags;
}
