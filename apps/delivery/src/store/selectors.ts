import { buildTree, type ProjectId } from "@baseline/domain";
import { createSelector } from "@reduxjs/toolkit";
import { breakdownItemsAdapter } from "./breakdownItemsSlice";
import type { RootState } from "./index";
import { projectsAdapter } from "./projectsSlice";
import { canMove, type BreakdownItemId } from "@baseline/domain";

const selectItemIdArg = (_state: RootState, itemId: BreakdownItemId) => itemId;

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
