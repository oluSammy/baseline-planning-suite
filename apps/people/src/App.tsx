import { Register } from "./features/register/Register";
import { useState } from "react";
import { resetToSeed } from "./store";
import { useAppDispatch } from "./store/hooks";
import type { EmployeeId } from "@baseline/domain";
import { EmployeeDetail } from "./features/employee/EmployeeDetail";

export function App() {
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<EmployeeId | null>(null);

  return (
    <main>
      <header>
        <h1>People</h1>
        <button type="button" onClick={() => dispatch(resetToSeed())}>
          Reset to seed
        </button>
      </header>
      {selectedId === null ? (
        <Register onSelect={setSelectedId} />
      ) : (
        <EmployeeDetail employeeId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </main>
  );
}
