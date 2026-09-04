import type { Allocation, BreakdownItem, Employee, EmployeeId, Month } from "./model";
import type { TreeNode } from "./tree";
import { largestRemainder, roundTo } from "./rounding";
import { personMonthsToHours, personMonthsToPercent, type DisplayUnit } from "./units";

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
// to their rounded total, derived rows are sums of displayed values.
export function reconcileForDisplay(
  rows: readonly GridRow[],
  months: readonly Month[],
  dp: number,
): GridRow[] {
  return rederive(
    rows,
    months,
    (row) => {
      const rounded = largestRemainder(
        months.map((m) => row.cells[m] ?? 0),
        dp,
      );
      return Object.fromEntries(
        months
          .map((m, index) => [m, rounded[index] ?? 0] as const)
          .filter(([m]) => row.cells[m] !== undefined),
      );
    },
    (value) => roundTo(value, dp),
  );
}

// Rebuilds a grid bottom-up: person rows get new cells from `personCells`
// every derived row becomes the sum of its (new) children, and every
// total the sum of its (new) cells. `finish` runs on each derived sum
function rederive(
  rows: readonly GridRow[],
  months: readonly Month[],
  personCells: (row: PersonRow) => MonthCells,
  finish: (value: number) => number = (value) => value,
): GridRow[] {
  const contributions = new Map<BreakdownItem["id"], MonthCells[]>();
  const push = (key: BreakdownItem["id"], cells: MonthCells) => {
    contributions.set(key, [...(contributions.get(key) ?? []), cells]);
  };

  const out: GridRow[] = [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (!row) continue;

    let cells: MonthCells;
    if (row.kind === "person") {
      cells = personCells(row);
      push(row.item.id, cells);
    } else {
      const summed = sumCells(contributions.get(row.item.id) ?? [], months);
      cells = Object.fromEntries(
        months.filter((m) => summed[m] !== undefined).map((m) => [m, finish(summed[m] ?? 0)]),
      );
      if (row.item.parentId !== null) push(row.item.parentId, cells);
    }

    out[i] = { ...row, cells, total: finish(totalOf(cells, months)) };
  }
  return out;
}

// converts a person-month grid into the requested unit, exactly, without rounding.
export function convertGrid(
  rows: readonly GridRow[],
  unit: DisplayUnit,
  months: readonly Month[],
  employees: ReadonlyMap<EmployeeId, Employee>,
): GridRow[] {
  switch (unit) {
    case "personMonths":
      return [...rows];
    case "percent":
      return rederive(rows, months, (row) => mapCells(row.cells, months, personMonthsToPercent));
    case "hours":
      return rederive(rows, months, (row) => {
        const employee = employees.get(row.employeeId);
        if (!employee) return {};
        return mapCells(row.cells, months, (pm, m) =>
          personMonthsToHours(pm, employee.weeklyHours, m),
        );
      });
  }
}

function mapCells(
  cells: MonthCells,
  months: readonly Month[],
  fn: (value: number, m: Month) => number,
): MonthCells {
  const out: MonthCells = {};
  for (const m of months) {
    const value = cells[m];
    if (value !== undefined) out[m] = fn(value, m);
  }
  return out;
}
