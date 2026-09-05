import { useState } from "react";
import type { EmployeeId } from "@baseline/domain";
import { Register } from "./features/register/Register";
import { resetToSeed } from "./store";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { selectActiveUser, selectCapacityAvailable, selectEmployeeById } from "./store/selectors";
import { EmployeeDetail } from "./features/employee/EmployeeDetail";

export function App() {
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<EmployeeId | null>(null);
  const capacityAvailable = useAppSelector(selectCapacityAvailable);
  const activeUser = useAppSelector(selectActiveUser);
  const activeName = useAppSelector((state) =>
    activeUser === null ? null : (selectEmployeeById(state, activeUser)?.name ?? activeUser),
  );

  return (
    <main className="baseline">
      <header>
        <h1>People</h1>
        <button type="button" onClick={() => dispatch(resetToSeed())}>
          Reset to seed
        </button>
        <p>{activeName === null ? "Nobody signed in" : `Signed in as ${activeName}`}</p>
      </header>
      {!capacityAvailable && (
        <p role="status">Staffing data unavailable. Capacity will show as unknown.</p>
      )}
      {selectedId === null ? (
        <Register onSelect={setSelectedId} />
      ) : (
        <EmployeeDetail employeeId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
