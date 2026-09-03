import { buildTree, type ProjectId } from "@baseline/domain";
import { createSelector } from "@reduxjs/toolkit";
import { breakdownItemsAdapter } from "./breakdownItemsSlice";
import type { RootState } from "./index";
import { projectsAdapter } from "./projectsSlice";

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
