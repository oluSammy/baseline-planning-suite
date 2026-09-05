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
    <main className="baseline delivery-page">
      <div className="delivery-title-row">
        <h1>Delivery</h1>
        <span className="delivery-signed">
          {activeName === null ? "Nobody signed in" : `Signed in as ${activeName}`}
        </span>
        {peopleAvailable ? (
          <span className="delivery-status">{headcount} people from the register</span>
        ) : (
          <span role="status" className="delivery-status delivery-status--unavailable">
            People register unavailable. Staffing will show IDs only.
          </span>
        )}
        <div className="delivery-spacer" />
        <button type="button" className="delivery-reset" onClick={() => dispatch(resetToSeed())}>
          Reset to seed
        </button>
      </div>
      {active === null ? (
        <p>No projects.</p>
      ) : (
        <>
          <ProjectSwitcher value={active} onChange={setProjectId} />
          <div className="delivery-columns">
            <div className="delivery-column-tree">
              <BreakdownTree projectId={active} />
            </div>
            <div className="delivery-column-grid">
              <StaffingGrid projectId={active} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
