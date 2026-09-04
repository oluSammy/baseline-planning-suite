import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import {
  selectAllEmployees,
  selectCapacityAvailable,
  selectEmployeesMatching,
  selectOversubscribedMonths,
} from "../../store/selectors";
import type { EmployeeId } from "@baseline/domain";

interface RegisterProps {
  readonly onSelect: (employeeId: EmployeeId) => void;
}

export function Register({ onSelect }: RegisterProps) {
  const [query, setQuery] = useState("");
  const employees = useAppSelector((state) => selectEmployeesMatching(state, query));
  const total = useAppSelector(selectAllEmployees).length;
  const oversubscribed = useAppSelector(selectOversubscribedMonths);
  const capacityAvailable = useAppSelector(selectCapacityAvailable);

  return (
    <section aria-labelledby="register-heading">
      <h2 id="register-heading">Employees</h2>
      <label>
        Search
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or role"
        />
      </label>
      <p>
        {employees.length} of {total}
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Role</th>
            <th scope="col">Hours / week</th>
            <th scope="col">Capacity</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const months = oversubscribed.get(employee.id) ?? [];
            return (
              <tr key={employee.id}>
                <td>
                  <button type="button" onClick={() => onSelect(employee.id)}>
                    {employee.name}
                  </button>
                </td>
                <td>{employee.role}</td>
                <td>{employee.weeklyHours}</td>
                <td>
                  {!capacityAvailable
                    ? "unknown"
                    : (months?.length ?? 0) > 0
                      ? `Over in ${months?.length} month${months?.length === 1 ? "" : "s"}`
                      : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
