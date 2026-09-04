import type { EmployeeId, RateRecordId } from "@baseline/domain";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { rateAdded, rateCorrected, rateRemoved } from "../../store/rateRecordsSlice";
import {
  selectCapacityAvailable,
  selectCurrency,
  selectEmployeeById,
  selectOversubscribedMonths,
  selectRateHistoryFor,
} from "../../store/selectors";
import { RateForm } from "./RateForm";

interface EmployeeDetailProps {
  readonly employeeId: EmployeeId;
  readonly onClose: () => void;
}

export function EmployeeDetail({ employeeId, onClose }: EmployeeDetailProps) {
  const employee = useAppSelector((state) => selectEmployeeById(state, employeeId));
  const periods = useAppSelector((state) => selectRateHistoryFor(state, employeeId));

  const months = useAppSelector(selectOversubscribedMonths).get(employeeId) ?? [];
  const capacityAvailable = useAppSelector(selectCapacityAvailable);

  const currency = useAppSelector(selectCurrency);
  const showConverted = currency.code !== "EUR";

  const dispatch = useAppDispatch();
  const [editingId, setEditingId] = useState<RateRecordId | null>(null);
  const records = periods.map((p) => p.record);

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
              {showConverted && <th scope="col">{currency.code} / hour</th>}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(({ record, validTo }) =>
              editingId === record.id ? (
                <tr key={record.id}>
                  <td colSpan={showConverted ? 5 : 4}>
                    <RateForm
                      initial={{ validFrom: record.validFrom, hourlyCost: record.hourlyCost }}
                      employeeRecords={records}
                      excludeId={record.id}
                      submitLabel="Save"
                      onCancel={() => setEditingId(null)}
                      onSubmit={(value) => {
                        dispatch(rateCorrected({ id: record.id, ...value }));
                        setEditingId(null);
                      }}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={record.id}>
                  <td>{record.validFrom}</td>
                  <td>{validTo ?? "open"}</td>
                  <td>{record.hourlyCost.toFixed(2)}</td>
                  {showConverted && <td>{(record.hourlyCost * currency.perEur).toFixed(2)}</td>}
                  <td>
                    <button type="button" onClick={() => setEditingId(record.id)}>
                      Correct
                    </button>
                    <button type="button" onClick={() => dispatch(rateRemoved(record.id))}>
                      Remove
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}

      <h3>Add rate</h3>
      <RateForm
        employeeRecords={records}
        excludeId={null}
        submitLabel="Add rate (in euros)"
        onSubmit={(value) => dispatch(rateAdded({ employeeId, ...value }))}
      />

      <h3>Capacity</h3>
      {!capacityAvailable ? (
        <p role="status">Staffing data unavailable, so capacity cannot be shown.</p>
      ) : months.length === 0 ? (
        <p>Within capacity in every month.</p>
      ) : (
        <ul>
          {months.map(({ month, total }) => (
            <li key={month}>
              {month}: {total.toFixed(2)} person-months across all projects
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
