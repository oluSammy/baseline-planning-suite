import type { ProjectId } from "@baseline/domain";
import { useState } from "react";
import { BreakdownTree } from "./features/breakdown/BreakdownTree";
import { ProjectSwitcher } from "./features/projects/ProjectSwitcher";
import { resetToSeed } from "./store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  selectActiveUser,
  selectAllEmployees,
  selectAllProjects,
  selectEmployeeById,
  selectPeopleAvailable,
} from "./store/selectors";
import { StaffingGrid } from "./features/grid/StaffingGrid";

export function App() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const [projectId, setProjectId] = useState<ProjectId | null>(null);
  const active = projectId ?? projects[0]?.id ?? null;

  const peopleAvailable = useAppSelector(selectPeopleAvailable);
  const headcount = useAppSelector(selectAllEmployees).length;
  const activeUser = useAppSelector(selectActiveUser);
  const activeName = useAppSelector((state) =>
    activeUser === null ? null : (selectEmployeeById(state, activeUser)?.name ?? activeUser),
  );

  return (
    <main className="baseline">
      <header>
        <h1>Delivery</h1>
        <button type="button" onClick={() => dispatch(resetToSeed())}>
          Reset to seed
        </button>
        <p>{activeName === null ? "Nobody signed in" : `Signed in as ${activeName}`}</p>
      </header>
      {peopleAvailable ? (
        <p>{headcount} people from the register</p>
      ) : (
        <p role="status">People register unavailable. Staffing will show IDs only.</p>
      )}
      {active === null ? (
        <p>No projects.</p>
      ) : (
        <>
          <ProjectSwitcher value={active} onChange={setProjectId} />
          <BreakdownTree projectId={active} />
          <StaffingGrid projectId={active} />
        </>
      )}
    </main>
  );
}
