import "./people.css";
import { useState } from "react";
import type { EmployeeId } from "@baseline/domain";
import { Register } from "./features/register/Register";
import { ResetToSeed } from "./ResetToSeed";
import { useAppSelector } from "./store/hooks";
import { selectActiveUser, selectCapacityAvailable, selectEmployeeById } from "./store/selectors";
import { EmployeeDetail } from "./features/employee/EmployeeDetail";

export function App() {
  const [selectedId, setSelectedId] = useState<EmployeeId | null>(null);
  const capacityAvailable = useAppSelector(selectCapacityAvailable);
  const activeUser = useAppSelector(selectActiveUser);
  const activeName = useAppSelector((state) =>
    activeUser === null ? null : (selectEmployeeById(state, activeUser)?.name ?? activeUser),
  );

  return (
    <main className={`baseline people-page${selectedId === null ? "" : " people-page--narrow"}`}>
      <header className="people-title-row">
        <h1>People</h1>
        <span className="people-signed">
          {activeName === null ? "Nobody signed in" : `Signed in as ${activeName}`}
        </span>
        <div className="people-spacer" />
        <ResetToSeed />
      </header>
      {!capacityAvailable && (
        <p role="status" className="notice-info people-status">
          Staffing data unavailable. Capacity will show as unknown.
        </p>
      )}
      {selectedId === null ? (
        <Register onSelect={setSelectedId} />
      ) : (
        <EmployeeDetail employeeId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
