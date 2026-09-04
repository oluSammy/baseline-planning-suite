import {
  buildTree,
  type ProjectId,
  canMove,
  type BreakdownItemId,
  buildGrid,
  monthOf,
  monthsBetween,
  type Employee,
  type EmployeeId,
  convertGrid,
  UNIT_DECIMALS,
  type DisplayUnit,
  unpricedCellKeys,
  type PeopleLookup,
  type RateRecord,
  type Month,
} from "@baseline/domain";
import { createSelector } from "@reduxjs/toolkit";
import { employeesAdapter, rateRecordsAdapter } from "./peopleSlice";
import { breakdownItemsAdapter } from "./breakdownItemsSlice";
import type { RootState } from "./index";
import { projectsAdapter } from "./projectsSlice";
import { allocationsAdapter } from "./allocationsSlice";
import { reconcileForDisplay } from "@baseline/domain";

const selectItemIdArg = (_state: RootState, itemId: BreakdownItemId) => itemId;

// Identifies one editable cell: a person on a leaf in a month.
export interface CellRef {
  readonly itemId: BreakdownItemId;
  readonly employeeId: EmployeeId;
  readonly month: Month;
}

export const { selectAll: selectAllProjects, selectById: selectProjectById } =
  projectsAdapter.getSelectors((state: RootState) => state.projects);

export const { selectAll: selectAllBreakdownItems } = breakdownItemsAdapter.getSelectors(
  (state: RootState) => state.breakdownItems,
);

const selectProjectIdArg = (_state: RootState, projectId: ProjectId) => projectId;

export const selectTreeForProject = createSelector(
  [selectAllBreakdownItems, selectProjectIdArg],
  (items, projectId) => buildTree(items, projectId),
);

// Items this one may become a child of, per the tree rules.
export const selectMoveTargets = createSelector(
  [selectAllBreakdownItems, selectItemIdArg],
  (items, itemId) => items.filter((candidate) => canMove(items, itemId, candidate.id).ok),
);

export const selectPeopleAvailable = (state: RootState) => state.people.available;

export const { selectAll: selectAllEmployees, selectById: selectEmployeeById } =
  employeesAdapter.getSelectors((state: RootState) => state.people.employees);

export const { selectAll: selectAllAllocations } = allocationsAdapter.getSelectors(
  (state: RootState) => state.allocations,
);

export const selectMonthsForProject = createSelector(
  [(state: RootState, projectId: ProjectId) => selectProjectById(state, projectId)],
  (project) => (project ? monthsBetween(monthOf(project.startDate), monthOf(project.endDate)) : []),
);

export const { selectAll: selectAllRateRecords } = rateRecordsAdapter.getSelectors(
  (state: RootState) => state.people.rateRecords,
);

const selectEmployeeLookup = createSelector([selectAllEmployees], (employees) => {
  return new Map<EmployeeId, Employee>(employees.map((e) => [e.id, e]));
});

export const selectGridForProject = createSelector(
  [selectTreeForProject, selectAllAllocations, selectEmployeeLookup, selectMonthsForProject],
  (tree, allocations, employees, months) => buildGrid(tree, allocations, employees, months),
);

const selectUnitArg = (_state: RootState, _projectId: ProjectId, unit: DisplayUnit) => unit;

export const selectPeopleLookup = createSelector(
  [selectAllEmployees, selectAllRateRecords],
  (employees, rateRecords): PeopleLookup => {
    const ratesByEmployee = new Map<EmployeeId, RateRecord[]>();
    for (const record of rateRecords) {
      ratesByEmployee.set(record.employeeId, [
        ...(ratesByEmployee.get(record.employeeId) ?? []),
        record,
      ]);
    }
    return { employees: new Map(employees.map((e) => [e.id, e])), ratesByEmployee };
  },
);

export const selectDisplayGridForProject = createSelector(
  [selectGridForProject, selectMonthsForProject, selectPeopleLookup, selectUnitArg],
  (rows, months, people, unit) =>
    reconcileForDisplay(convertGrid(rows, unit, months, people), months, UNIT_DECIMALS[unit]),
);

export const selectUnpricedCellKeys = createSelector(
  [selectGridForProject, selectMonthsForProject, selectPeopleLookup],
  (rows, months, people) => unpricedCellKeys(rows, months, people),
);

const selectCellArg = (_state: RootState, cell: CellRef) => cell;

// Exact person-months stored for a cell. Zero when nothing is allocated.
export const selectCellPersonMonths = createSelector(
  [selectAllAllocations, selectCellArg],
  (allocations, cell) =>
    allocations
      .filter(
        (a) =>
          a.breakdownItemId === cell.itemId &&
          a.employeeId === cell.employeeId &&
          a.month === cell.month,
      )
      .reduce((acc, a) => acc + a.amount, 0),
);
