import type { EmployeeId } from "@baseline/domain";
import { useAppSelector } from "../../store/hooks";
import { selectEmployeeById, selectRateHistoryFor } from "../../store/selectors";

interface EmployeeDetailProps {
  readonly employeeId: EmployeeId;
  readonly onClose: () => void;
}

export function EmployeeDetail({ employeeId, onClose }: EmployeeDetailProps) {
  const employee = useAppSelector((state) => selectEmployeeById(state, employeeId));
  const periods = useAppSelector((state) => selectRateHistoryFor(state, employeeId));

  if (!employee) {
    return <p role="alert">Employee not found.</p>;
  }

  return (
    <section aria-labelledby="employee-heading">
      <header>
        <h2 id="employee-heading">{employee.name}</h2>
        <p>
          {employee.role} · {employee.weeklyHours} h/week
        </p>
        <button type="button" onClick={onClose}>
          Back to register
        </button>
      </header>

      <h3>Cost rate history</h3>
      {periods.length === 0 ? (
        <p>No rates recorded.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Valid from</th>
              <th scope="col">Until</th>
              <th scope="col">€ / hour</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(({ record, validTo }) => (
              <tr key={record.id}>
                <td>{record.validFrom}</td>
                <td>{validTo ?? "open"}</td>
                <td>{record.hourlyCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
