import { useState } from "react";
import { UNIT_DECIMALS, type DisplayUnit, type Month, type ProjectId } from "@baseline/domain";
import { useAppSelector } from "../../store/hooks";
import {
  selectDisplayGridForProject,
  selectMonthsForProject,
  selectPeopleAvailable,
} from "../../store/selectors";
interface StaffingGridProps {
  readonly projectId: ProjectId;
}

const UNIT_LABELS: Readonly<Record<DisplayUnit, string>> = {
  personMonths: "PM",
  hours: "Hours",
  percent: "%",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `2026-04` → `Apr 26`, as in the brief's Figure 5. */
function formatMonth(month: Month): string {
  const [year, mon] = month.split("-");
  return `${MONTH_NAMES[Number(mon) - 1]} ${year?.slice(2)}`;
}

export function StaffingGrid({ projectId }: StaffingGridProps) {
  const months = useAppSelector((state) => selectMonthsForProject(state, projectId));
  const [unit, setUnit] = useState<DisplayUnit>("personMonths");
  const peopleAvailable = useAppSelector(selectPeopleAvailable);
  const rows = useAppSelector((state) => selectDisplayGridForProject(state, projectId, unit));
  const dp = UNIT_DECIMALS[unit];

  return (
    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading">Staffing</h2>
      <fieldset>
        <legend>Unit</legend>
        {(Object.keys(UNIT_LABELS) as DisplayUnit[]).map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="unit"
              value={option}
              checked={unit === option}
              disabled={option === "hours" && !peopleAvailable}
              onChange={() => setUnit(option)}
            />
            {UNIT_LABELS[option]}
          </label>
        ))}
      </fieldset>
      <table>
        <thead>
          <tr>
            <th scope="col">Work package / person</th>
            {months.map((m) => (
              <th key={m} scope="col">
                {formatMonth(m)}
              </th>
            ))}
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.kind === "item" ? row.item.id : `${row.item.id}:${row.employeeId}`}>
              <th scope="row" style={{ paddingLeft: `${row.depth - 1}rem` }}>
                {row.kind === "item" ? (
                  <>
                    {row.item.name} <small>DERIVED</small>
                  </>
                ) : (
                  row.label
                )}
              </th>
              {months.map((m) => (
                <td key={m}>{row.cells[m] === undefined ? "" : row.cells[m].toFixed(dp)}</td>
              ))}
              <td>{row.total.toFixed(dp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
