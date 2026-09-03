import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { selectAllEmployees, selectEmployeesMatching } from "../../store/selectors";
import type { EmployeeId } from "@baseline/domain";

interface RegisterProps {
  readonly onSelect: (employeeId: EmployeeId) => void;
}

export function Register({ onSelect }: RegisterProps) {
  const [query, setQuery] = useState("");
  const employees = useAppSelector((state) => selectEmployeesMatching(state, query));
  const total = useAppSelector(selectAllEmployees).length;

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
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <button type="button" onClick={() => onSelect(employee.id)}>
                  {employee.name}
                </button>
              </td>
              <td>{employee.role}</td>
              <td>{employee.weeklyHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
