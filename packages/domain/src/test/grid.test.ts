import { describe, expect, it } from "vitest";
import { buildGrid, convertGrid, type PeopleLookup, type PersonRow } from "../grid";
import {
  hourlyCost,
  isoDate,
  month,
  personMonths,
  type Allocation,
  type AllocationId,
  type BreakdownItem,
  type BreakdownItemId,
  type Employee,
  type EmployeeId,
  type ProjectId,
  type RateRecord,
  type RateRecordId,
} from "../model";
import { buildTree } from "../tree";

const project = "p1" as ProjectId;
const m1 = month("2026-03");
const m2 = month("2026-04");
const item = (id: string, parentId: string | null): BreakdownItem => ({
  id: id as BreakdownItemId,
  projectId: project,
  parentId: parentId as BreakdownItemId | null,
  name: id,
});

const alloc = (
  id: string,
  itemId: string,
  emp: string,
  m: ReturnType<typeof month>,
  amount: number,
): Allocation => ({
  id: id as AllocationId,
  breakdownItemId: itemId as BreakdownItemId,
  employeeId: emp as EmployeeId,
  month: m,
  amount: personMonths(amount),
});
const employees = new Map<EmployeeId, Employee>([
  ["e1" as EmployeeId, { id: "e1" as EmployeeId, name: "Zoe", role: "Dev", weeklyHours: 40 }],
]);

describe("buildGrid", () => {
  const tree = buildTree([item("p", null), item("leaf", "p")], project);
  const allocations = [
    alloc("a1", "leaf", "e1", m1, 0.5),
    alloc("a2", "leaf", "e2", m1, 0.25),
    alloc("a3", "leaf", "e2", m2, 0.25),
    alloc("a4", "leaf", "e2", month("2030-01"), 9),
  ];
  const rows = buildGrid(tree, allocations, employees, [m1, m2]);

  it("lays out parent, leaf, then people sorted by label", () => {
    expect(rows.map((r) => (r.kind === "item" ? r.item.id : r.label))).toEqual([
      "p",
      "leaf",
      "e2",
      "Zoe",
    ]);
  });

  it("derives leaf cells from people and parent cells from children", () => {
    const [parent, leaf] = rows;
    expect(leaf?.cells).toEqual({ [m1]: 0.75, [m2]: 0.25 });
    expect(leaf?.total).toBe(1);
    expect(parent?.cells).toEqual(leaf?.cells);
  });

  it("ignores allocations outside the horizon and labels unknown employees by id", () => {
    const e2 = rows.find((r): r is PersonRow => r.kind === "person" && r.employeeId === "e2");
    expect(e2?.total).toBe(0.5);
    expect(e2?.label).toBe("e2");
  });
});

describe("convertGrid", () => {
  const tree = buildTree([item("leaf", null)], project);
  const rows = buildGrid(tree, [alloc("a1", "leaf", "e1", m1, 0.5)], employees, [m1]);
  const okaforRates: RateRecord[] = [
    {
      id: "r1" as RateRecordId,
      employeeId: "e1" as EmployeeId,
      validFrom: isoDate("2025-01-01"),
      hourlyCost: hourlyCost(80),
    },
    {
      id: "r2" as RateRecordId,
      employeeId: "e1" as EmployeeId,
      validFrom: isoDate("2026-03-12"),
      hourlyCost: hourlyCost(95),
    },
  ];
  const people: PeopleLookup = {
    employees,
    ratesByEmployee: new Map([["e1" as EmployeeId, okaforRates]]),
  };

  it("converts person rows and re-derives parents in hours and percent", () => {
    const [leafHours, personHours] = convertGrid(rows, "hours", [m1], people);
    expect(personHours?.cells[m1]).toBe(88);
    expect(leafHours?.cells[m1]).toBe(88);

    const [, personPercent] = convertGrid(rows, "percent", [m1], people);
    expect(personPercent?.cells[m1]).toBe(50);
  });

  it("prices cost per the reference calculation", () => {
    const [leafCost, personCost] = convertGrid(rows, "cost", [m1], people);
    expect(personCost?.cells[m1]).toBe(7880);
    expect(leafCost?.cells[m1]).toBe(7880);
  });

  it("leaves person-months untouched", () => {
    expect(convertGrid(rows, "personMonths", [m1], people)).toEqual(rows);
  });
});

it("shows pending people as empty rows so they can be edited", () => {
  const tree = buildTree([item("leaf", null)], project);
  const pending = new Map([["leaf" as BreakdownItemId, ["e1" as EmployeeId]]]);
  const rows = buildGrid(tree, [], employees, [m1], pending);
  expect(rows.map((r) => r.kind)).toEqual(["item", "person"]);
  expect(rows[1]?.cells).toEqual({});
});
