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
      <button type="button" className="link-button people-back" onClick={onClose}>
        ← Back to register
      </button>
      <div className="people-detail-head">
        <h2 id="employee-heading">{employee.name}</h2>
        <span className="people-detail-meta">
          {employee.role} · {employee.weeklyHours} h/week
        </span>
      </div>
      <section className="card people-card" aria-labelledby="capacity-heading">
        <h3 id="capacity-heading" className="eyebrow">
          Capacity
        </h3>
        {!capacityAvailable ? (
          <p className="notice-info">Staffing data unavailable. Capacity will show as unknown.</p>
        ) : months.length === 0 ? (
          <p>Within capacity in every month.</p>
        ) : (
          <ul>
            {months.map(({ month, total }) => (
              <li key={month} className="people-over-line num">
                † {month}: {total.toFixed(2)} person-months across all projects
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card people-card" aria-labelledby="rates-heading">
        <h3 id="rates-heading" className="eyebrow">
          Cost rate history
        </h3>
        {periods.length === 0 ? (
          <p className="notice-info">
            No rates on record. Months with working days will be unpriced in Delivery.
          </p>
        ) : (
          <table className="people-rates">
            <thead>
              <tr>
                <th scope="col" className="eyebrow">
                  Valid from
                </th>
                <th scope="col" className="eyebrow">
                  Until
                </th>
                <th scope="col" className="eyebrow num">
                  € / hour
                </th>
                {showConverted && (
                  <th scope="col" className="eyebrow num">
                    {currency.code} / hour
                  </th>
                )}
                <th scope="col" className="eyebrow people-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {periods.map(({ record, validTo }) =>
                editingId === record.id ? (
                  <tr key={record.id}>
                    <td colSpan={showConverted ? 5 : 4} className="people-edit-cell">
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
                    <td className="num">{record.validFrom}</td>
                    <td className="num people-muted">{validTo ?? "open"}</td>
                    <td className="num">{record.hourlyCost.toFixed(2)}</td>
                    {showConverted && (
                      <td className="num people-muted">
                        {(record.hourlyCost * currency.perEur).toFixed(2)}
                      </td>
                    )}
                    <td className="people-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setEditingId(record.id)}
                      >
                        Correct
                      </button>
                      <button
                        type="button"
                        className="link-button people-remove"
                        onClick={() => dispatch(rateRemoved(record.id))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}

        <div className="people-add">
          <h3>Add rate (in euros)</h3>
          <RateForm
            employeeRecords={records}
            excludeId={null}
            submitLabel="Add"
            onSubmit={(value) => dispatch(rateAdded({ employeeId, ...value }))}
          />
        </div>
      </section>
    </section>
  );
}
