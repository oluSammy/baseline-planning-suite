import type { Month, ProjectId } from "@baseline/domain";
import { useAppSelector } from "../../store/hooks";
import { selectDisplayGridForProject, selectMonthsForProject } from "../../store/selectors";

interface StaffingGridProps {
  readonly projectId: ProjectId;
}

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
  const displayRows = useAppSelector((state) => selectDisplayGridForProject(state, projectId));

  return (
    <section aria-labelledby="grid-heading">
      <h2 id="grid-heading">Staffing</h2>
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
          {displayRows.map(({ row, cells, total }) => (
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
                <td key={m}>{row.cells[m] === undefined ? "" : cells[m]?.toFixed(2)}</td>
              ))}
              <td>{total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
