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
    if (total > 1 + EPSILON) {
      flags.set(key, { employeeId: culprit.employeeId, month: culprit.month, total, culprit });
    }
  }
  return flags;
}
