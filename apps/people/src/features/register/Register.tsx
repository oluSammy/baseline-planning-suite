import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { selectEmployeesMatching } from "../../store/selectors";

export function Register() {
  const [query, setQuery] = useState("");
  const employees = useAppSelector((state) => selectEmployeesMatching(state, query));

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
      <p>{employees.length} of 60</p>
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
              <td>{employee.name}</td>
              <td>{employee.role}</td>
              <td>{employee.weeklyHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
