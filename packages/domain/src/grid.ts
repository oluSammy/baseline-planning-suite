import type { Allocation, BreakdownItem, Employee, EmployeeId, Month } from "./model";
import type { TreeNode } from "./tree";

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

export type GridRow = ItemRow | PersonRow;

function sumCells(rows: readonly { cells: MonthCells }[], months: readonly Month[]): MonthCells {
  const cells: MonthCells = {};
  for (const m of months) {
    const sum = rows.reduce((acc, row) => acc + (row.cells[m] ?? 0), 0);
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
      const cells = sumCells(personRows, months);
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
    const cells = sumCells(directChildren, months);
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
