import { useState } from "react";
import {
  capacityKey,
  personMonths,
  toPersonMonths,
  UNIT_DECIMALS,
  type BreakdownItemId,
  type CapacityFlag,
  type DisplayUnit,
  type EmployeeId,
  type GridRow,
  type Month,
  type ProjectId,
} from "@baseline/domain";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectAllEmployees,
  selectDisplayGridForProject,
  selectItemLabels,
  selectMonthsForProject,
  selectOverCapacity,
  selectPeopleAvailable,
  selectPeopleLookup,
  selectUnpricedCellKeys,
  type CellRef,
} from "../../store/selectors";
import { CellInspector } from "./CellInspector";
import { allocationSet } from "../../store/allocationsSlice";
import { CellEditor } from "./CellEditor";
interface StaffingGridProps {
  readonly projectId: ProjectId;
}

const UNIT_LABELS: Readonly<Record<DisplayUnit, string>> = {
  personMonths: "PM",
  hours: "Hours",
  percent: "%",
  cost: "€",
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

// `2026-04` - `Apr 26`
function formatMonth(month: Month): string {
  const [year, mon] = month.split("-");
  return `${MONTH_NAMES[Number(mon) - 1]} ${year?.slice(2)}`;
}

export function StaffingGrid({ projectId }: StaffingGridProps) {
  const months = useAppSelector((state) => selectMonthsForProject(state, projectId));
  const [unit, setUnit] = useState<DisplayUnit>("personMonths");
  const peopleAvailable = useAppSelector(selectPeopleAvailable);
  const over = useAppSelector(selectOverCapacity);
  const itemLabels = useAppSelector(selectItemLabels);
  const rows = useAppSelector((state) =>
    selectDisplayGridForProject(state, projectId, pending, unit),
  );
  const unpriced = useAppSelector((state) => selectUnpricedCellKeys(state, projectId, pending));
  const dp = UNIT_DECIMALS[unit];

  const [pending, setPending] = useState<ReadonlyMap<BreakdownItemId, readonly EmployeeId[]>>(
    new Map(),
  );
  const employees = useAppSelector(selectAllEmployees);

  const assign = (itemId: BreakdownItemId, employeeId: EmployeeId) => {
    setPending((prev) => new Map(prev).set(itemId, [...(prev.get(itemId) ?? []), employeeId]));
  };

  const dispatch = useAppDispatch();
  const people = useAppSelector(selectPeopleLookup);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CellRef | null>(null);
  const selectedItemName = selected
    ? (rows.find((r) => r.kind === "item" && r.item.id === selected.itemId)?.item.name ?? "")
    : "";

  const commit = (row: GridRow & { kind: "person" }, m: Month, text: string) => {
    const employee = people.employees.get(row.employeeId);
    try {
      const pm = toPersonMonths(text.trim() === "" ? 0 : Number(text), unit, {
        month: m,
        weeklyHours: employee?.weeklyHours ?? null,
        rateRecords: people.ratesByEmployee.get(row.employeeId) ?? [],
      });
      dispatch(
        allocationSet({
          itemId: row.item.id,
          employeeId: row.employeeId,
          month: m,
          amount: personMonths(pm),
        }),
      );
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid value");
    }
  };

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
              disabled={(option === "hours" || option === "cost") && !peopleAvailable}
              onChange={() => setUnit(option)}
            />
            {UNIT_LABELS[option]}
          </label>
        ))}
      </fieldset>
      {error && <p role="alert">{error}</p>}
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
                {row.kind === "item" && row.isLeaf && (
                  <select
                    aria-label={`Assign a person to ${row.item.name}`}
                    value=""
                    onChange={(event) => {
                      if (event.target.value) assign(row.item.id, event.target.value as EmployeeId);
                    }}
                  >
                    <option value="">Assign person…</option>
                    {employees
                      .filter(
                        (e) =>
                          !rows.some(
                            (r) =>
                              r.kind === "person" &&
                              r.item.id === row.item.id &&
                              r.employeeId === e.id,
                          ),
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </select>
                )}
              </th>
              {months.map((m) => {
                const value = row.cells[m] === undefined ? "" : row.cells[m].toFixed(dp);
                const isUnpriced = row.kind === "person" && unpriced.has(`${row.employeeId}|${m}`);
                const isSelected =
                  row.kind === "person" &&
                  selected?.itemId === row.item.id &&
                  selected.employeeId === row.employeeId &&
                  selected.month === m;

                return (
                  <td key={m} aria-selected={isSelected || undefined}>
                    {row.kind === "person" ? (
                      isSelected ? (
                        <CellEditor
                          key={`${row.employeeId}|${m}`}
                          initial={value}
                          onCommit={(text) => commit(row, m, text)}
                          onCancel={() => setSelected(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSelected({
                              itemId: row.item.id,
                              employeeId: row.employeeId,
                              month: m,
                            })
                          }
                        >
                          {value || "–"}
                        </button>
                      )
                    ) : (
                      value
                    )}
                    {isUnpriced && (
                      <abbr title="Some working days have no rate and are priced at zero">*</abbr>
                    )}
                    {row.kind === "person" && capacityMarker(row.employeeId, m, over, itemLabels)}
                  </td>
                );
              })}
              <td>{row.total.toFixed(dp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <CellInspector
          cell={selected}
          itemName={selectedItemName}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

const capacityMarker = (
  employeeId: EmployeeId,
  m: Month,
  over: ReadonlyMap<string, CapacityFlag>,
  itemLabels: Map<BreakdownItemId, string>,
) => {
  const flag = over.get(capacityKey(employeeId, m));
  if (!flag) return null;
  const cause = itemLabels.get(flag.culprit.breakdownItemId) ?? "another assignment";
  return (
    <abbr
      title={`Over capacity: ${flag.total.toFixed(2)} person-months across all projects. Caused by ${cause}.`}
    >
      †
    </abbr>
  );
};
