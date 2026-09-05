import type { Project, ProjectId } from "@baseline/domain";
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";

export const projectsAdapter = createEntityAdapter<Project, ProjectId>({
  selectId: (project) => project.id,
});

export const projectsSlice = createSlice({
  name: "projects",
  initialState: projectsAdapter.getInitialState(),
  reducers: {},
});

export const projectsReducer = projectsSlice.reducer;
