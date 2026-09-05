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
    <section aria-label="Employees">
      <div className="people-search-row">
        <input
          type="search"
          className="field"
          aria-label="Search by name or role"
          placeholder="Search by name or role"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="people-count num">
          {employees.length} of {total}
        </span>
      </div>
      <table className="people-table">
        <thead>
          <tr>
            <th scope="col" className="eyebrow">
              Name
            </th>
            <th scope="col" className="eyebrow">
              Role
            </th>
            <th scope="col" className="eyebrow num">
              Hours / week
            </th>
            <th scope="col" className="eyebrow">
              Capacity
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const months = oversubscribed.get(employee.id) ?? [];
            return (
              <tr key={employee.id}>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onSelect(employee.id)}
                  >
                    {employee.name}
                  </button>
                </td>
                <td>{employee.role}</td>
                <td className="num">{employee.weeklyHours}</td>
                <td>
                  {!capacityAvailable ? (
                    <span className="people-capacity">unknown</span>
                  ) : (months?.length ?? 0) > 0 ? (
                    <span className="people-capacity people-capacity--over">
                      Over in {months.length} month{months.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
