import { useState, type CSSProperties } from "react";
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
  type PeopleLookup,
  type ProjectId,
} from "@baseline/domain";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectActiveUser,
  selectAllEmployees,
  selectCurrency,
  selectDisplayGridForProject,
  selectItemLabels,
  selectMonthsForProject,
  selectOverCapacity,
  selectPeopleAvailable,
  selectPeopleLookup,
  selectUnpricedCellKeys,
  type CellRef,
} from "../../store/selectors";
import { allocationSet } from "../../store/allocationsSlice";
import { CellEditor } from "./CellEditor";
import { CellInspector } from "./CellInspector";

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

/** Column widths from the design: label, one per month, total. */
const LABEL_COLUMN_WIDTH = 304;
const MONTH_COLUMN_WIDTH = 67;
const TOTAL_COLUMN_WIDTH = 80;

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
  const [pending, setPending] = useState<ReadonlyMap<BreakdownItemId, readonly EmployeeId[]>>(
    new Map(),
  );
  const rows = useAppSelector((state) =>
    selectDisplayGridForProject(state, projectId, pending, unit),
  );
  const unpriced = useAppSelector((state) => selectUnpricedCellKeys(state, projectId, pending));
  const currency = useAppSelector(selectCurrency);
  const activeUser = useAppSelector(selectActiveUser);
  const dp = UNIT_DECIMALS[unit];

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
      const raw = text.trim() === "" ? 0 : Number(text);
      const inEur = unit === "cost" ? raw / currency.perEur : raw;
      const pm = toPersonMonths(inEur, unit, {
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
          ...(activeUser === null ? {} : { updatedBy: activeUser }),
        }),
      );
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid value");
    }
  };

  return (
    <section className="card delivery-grid" aria-labelledby="grid-heading">
      <div className="delivery-grid-head">
        <h2 id="grid-heading" className="eyebrow">
          Staffing
        </h2>
        <span className="delivery-spacer" />
        <span className="delivery-unit-label">Unit</span>
        <fieldset className="delivery-unit">
          <legend>Unit</legend>
          {(Object.keys(UNIT_LABELS) as DisplayUnit[]).map((option) => {
            const disabled = (option === "hours" || option === "cost") && !peopleAvailable;
            return (
              <label
                key={option}
                title={disabled ? "Unavailable while the People register is down" : undefined}
              >
                <input
                  type="radio"
                  name="unit"
                  value={option}
                  checked={unit === option}
                  disabled={disabled}
                  onChange={() => setUnit(option)}
                />
                {option === "cost" ? currency.code : UNIT_LABELS[option]}
              </label>
            );
          })}
        </fieldset>
      </div>

      {error && (
        <p role="alert" className="error-line delivery-grid-error">
          {error}
        </p>
      )}

      <div className="delivery-grid-scroll">
        <table className="delivery-grid-table">
          <colgroup>
            <col style={{ width: LABEL_COLUMN_WIDTH }} />
            {months.map((m) => (
              <col key={m} style={{ width: MONTH_COLUMN_WIDTH }} />
            ))}
            <col style={{ width: TOTAL_COLUMN_WIDTH }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Work package / person</th>
              {months.map((m) => (
                <th key={m} scope="col" className="num">
                  {formatMonth(m)}
                </th>
              ))}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.kind === "item" ? row.item.id : `${row.item.id}:${row.employeeId}`}
                className={`delivery-row delivery-row--${row.kind === "item" ? "derived" : "person"}`}
                style={{ "--depth": row.depth } as CSSProperties}
              >
                <th scope="row" className="delivery-label">
                  <span className="delivery-label-name">
                    {row.kind === "item" ? row.item.name : row.label}
                  </span>
                  {row.kind === "item" && <span className="delivery-derived-chip">DERIVED</span>}
                  <span className="delivery-spacer" />
                  {row.kind === "item" && row.isLeaf && (
                    <select
                      className="delivery-assign"
                      aria-label={`Assign a person to ${row.item.name}`}
                      value=""
                      onChange={(event) => {
                        if (event.target.value)
                          assign(row.item.id, event.target.value as EmployeeId);
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
                  const isUnpriced =
                    row.kind === "person" && unpriced.has(`${row.employeeId}|${m}`);
                  const isSelected =
                    row.kind === "person" &&
                    selected?.itemId === row.item.id &&
                    selected.employeeId === row.employeeId &&
                    selected.month === m;

                  return (
                    <td
                      key={m}
                      className="delivery-cell num"
                      aria-selected={isSelected || undefined}
                    >
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
                            className="delivery-cell-button"
                            onClick={() =>
                              setSelected({
                                itemId: row.item.id,
                                employeeId: row.employeeId,
                                month: m,
                              })
                            }
                          >
                            {value || "–"}
                            {isUnpriced && (
                              <abbr
                                className="delivery-marker delivery-marker--unpriced"
                                title="Some working days have no rate and are priced at zero"
                              >
                                *
                              </abbr>
                            )}
                            {capacityMarker(row.employeeId, m, over, itemLabels, people)}
                          </button>
                        )
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
                <td className="delivery-cell delivery-total num">{row.total.toFixed(dp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
  people: PeopleLookup,
) => {
  const flag = over.get(capacityKey(employeeId, m));
  if (!flag) return null;
  const cause = itemLabels.get(flag.culprit.breakdownItemId) ?? "another assignment";

  const editor = flag.culprit.updatedBy
    ? people.employees.get(flag.culprit.updatedBy)?.name
    : undefined;
  const suffix = editor ? `, edited by ${editor}` : "";

  return (
    <abbr
      className="delivery-marker delivery-marker--over"
      title={`Over capacity: ${flag.total.toFixed(2)} person-months across all projects. Caused by ${cause}${suffix}.`}
    >
      †
    </abbr>
  );
};
