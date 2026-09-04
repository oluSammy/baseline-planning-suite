import type { Allocation, BreakdownItem, Employee, EmployeeId, Month } from "./model";
import type { TreeNode } from "./tree";
import { largestRemainder, roundTo } from "./rounding";

// Person-months per month. Missing month means no allocation.
export type MonthCells = Partial<Record<Month, number>>;

// A work package row. Always derived: a leaf sums its people, a parent sums its children.
export interface ItemRow {
  readonly kind: "item";
  readonly item: BreakdownItem;
  readonly depth: number;
  readonly isLeaf: boolean;
  readonly cells: MonthCells;
  readonly total: number;
}

/** One person on one leaf. The only kind of row that can be edited. */
export interface PersonRow {
  readonly kind: "person";
  readonly item: BreakdownItem;
  readonly depth: number;
  readonly employeeId: EmployeeId;
  readonly label: string;
  readonly cells: MonthCells;
  readonly total: number;
}

export interface DisplayRow {
  readonly row: GridRow;
  readonly cells: MonthCells;
  readonly total: number;
}

export type GridRow = ItemRow | PersonRow;

function sumCells(cellSets: readonly MonthCells[], months: readonly Month[]): MonthCells {
  const cells: MonthCells = {};
  for (const m of months) {
    const sum = cellSets.reduce((acc, set) => acc + (set[m] ?? 0), 0);
    if (sum !== 0) cells[m] = sum;
  }
  return cells;
}

function totalOf(cells: MonthCells, months: readonly Month[]): number {
  return months.reduce((acc, m) => acc + (cells[m] ?? 0), 0);
}

export function buildGrid(
  tree: readonly TreeNode[],
  allocations: readonly Allocation[],
  employees: ReadonlyMap<EmployeeId, Employee>,
  months: readonly Month[],
): GridRow[] {
  const inHorizon = new Set(months);
  const byItem = new Map<BreakdownItem["id"], Allocation[]>();
  for (const a of allocations) {
    if (!inHorizon.has(a.month)) continue;
    const list = byItem.get(a.breakdownItemId) ?? [];
    list.push(a);
    byItem.set(a.breakdownItemId, list);
  }

  const walk = (node: TreeNode): GridRow[] => {
    if (node.children.length === 0) {
      const people = new Map<EmployeeId, MonthCells>();
      for (const a of byItem.get(node.item.id) ?? []) {
        const cells = people.get(a.employeeId) ?? {};
        cells[a.month] = (cells[a.month] ?? 0) + a.amount;
        people.set(a.employeeId, cells);
      }
      const personRows: PersonRow[] = [...people.entries()]
        .map(([employeeId, cells]) => ({
          kind: "person" as const,
          item: node.item,
          depth: node.depth + 1,
          employeeId,
          label: employees.get(employeeId)?.name ?? employeeId,
          cells,
          total: totalOf(cells, months),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      const cells = sumCells(
        personRows.map((r) => r.cells),
        months,
      );
      return [
        {
          kind: "item",
          item: node.item,
          depth: node.depth,
          isLeaf: true,
          cells,
          total: totalOf(cells, months),
        },
        ...personRows,
      ];
    }

    const childRows = node.children.flatMap(walk);
    const directChildren = childRows.filter(
      (row) => row.kind === "item" && row.depth === node.depth + 1,
    );
    const cells = sumCells(
      directChildren.map((r) => r.cells),
      months,
    );
    return [
      {
        kind: "item",
        item: node.item,
        depth: node.depth,
        isLeaf: false,
        cells,
        total: totalOf(cells, months),
      },
      ...childRows,
    ];
  };

  return tree.flatMap(walk);
}

// person rows are rounded with largest remainder so their cells add
// to their rounded total
export function reconcileForDisplay(
  rows: readonly GridRow[],
  months: readonly Month[],
  dp: number,
): DisplayRow[] {
  const contributions = new Map<BreakdownItem["id"], MonthCells[]>();
  const push = (key: BreakdownItem["id"], cells: MonthCells) => {
    contributions.set(key, [...(contributions.get(key) ?? []), cells]);
  };

  const out: DisplayRow[] = [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (!row) continue;

    let cells: MonthCells;
    if (row.kind === "person") {
      const rounded = largestRemainder(
        months.map((m) => row.cells[m] ?? 0),
        dp,
      );
      cells = Object.fromEntries(months.map((m, index) => [m, rounded[index] ?? 0]));
      push(row.item.id, cells);
    } else {
      const summed = sumCells(contributions.get(row.item.id) ?? [], months);
      cells = Object.fromEntries(months.map((m) => [m, roundTo(summed[m] ?? 0, dp)]));
      if (row.item.parentId !== null) push(row.item.parentId, cells);
    }

    const total = roundTo(
      months.reduce((acc, m) => acc + (cells[m] ?? 0), 0),
      dp,
    );
    out[i] = { row, cells, total };
  }
  return out;
}
