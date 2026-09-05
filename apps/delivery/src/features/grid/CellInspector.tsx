import { capacityKey, personMonthsToPercent, priceAllocation, roundTo } from "@baseline/domain";
import { useMemo } from "react";
import { useAppSelector } from "../../store/hooks";
import {
  selectCellPersonMonths,
  selectCurrency,
  selectOverCapacity,
  selectPeopleLookup,
  type CellRef,
} from "../../store/selectors";

interface CellInspectorProps {
  readonly cell: CellRef;
  readonly itemName: string;
  readonly onClose: () => void;
}

const euro = (value: number, dp = 2) => `€${value.toFixed(dp)}`;
const hours = (value: number) => `${value.toFixed(2)} h`;

/** The brief's Figure 4 for one cell: every intermediate the pricing rule produces. */
export function CellInspector({ cell, itemName, onClose }: CellInspectorProps) {
  const personMonths = useAppSelector((state) => selectCellPersonMonths(state, cell));
  const people = useAppSelector(selectPeopleLookup);
  const employee = people.employees.get(cell.employeeId);
  const rateRecords = people.ratesByEmployee.get(cell.employeeId) ?? [];
  const flag = useAppSelector(selectOverCapacity).get(capacityKey(cell.employeeId, cell.month));
  const currency = useAppSelector(selectCurrency);

  const pricing = useMemo(
    () =>
      employee
        ? priceAllocation({
            personMonths,
            month: cell.month,
            weeklyHours: employee.weeklyHours,
            rateRecords,
          })
        : null,
    [employee, personMonths, cell.month, rateRecords],
  );

  const unpricedTone = pricing && pricing.unpricedDays > 0 ? " delivery-tone-info" : "";

  return (
    <aside className="card delivery-inspector" aria-labelledby="inspector-heading">
      <div className="delivery-inspector-head">
        <h3 id="inspector-heading">
          {employee?.name ?? cell.employeeId} · {itemName} · {cell.month}
        </h3>
        <span className="delivery-spacer" />
        <button type="button" className="delivery-inspector-close" onClick={onClose}>
          Close
        </button>
      </div>
      {!employee || !pricing ? (
        <p role="status" className="notice-info">
          This cell cannot be priced while the People register is unavailable.
        </p>
      ) : (
        <dl className="delivery-inspector-list">
          <dt>Inputs</dt>
          <dd className="num">
            {employee.weeklyHours} h/week. Rates:{" "}
            {rateRecords.length === 0
              ? "none on record"
              : [...rateRecords]
                  .sort((a, b) => a.validFrom.localeCompare(b.validFrom))
                  .map((r) => `${euro(r.hourlyCost)}/h from ${r.validFrom}`)
                  .join(", ")}
            . This cell: {personMonths.toFixed(2)} person-months.
          </dd>

          <dt>Working days in {cell.month}</dt>
          <dd className="num">{pricing.workingDays}</dd>

          <dt>Slices</dt>
          <dd className={`num${unpricedTone}`}>
            {pricing.slices
              .map(
                (slice) =>
                  `${slice.from} to ${slice.to}: ${slice.workingDays} working days at ${
                    slice.hourlyCost === null ? "no rate" : `${euro(slice.hourlyCost)}/h`
                  }`,
              )
              .join("; ")}
          </dd>

          <dt>One person-month</dt>
          <dd className="num">
            {employee.weeklyHours} × {pricing.workingDays} ÷ 5 = {hours(pricing.personMonthHours)}
          </dd>

          <dt>This allocation in hours</dt>
          <dd className="num">
            {personMonths.toFixed(2)} × {pricing.personMonthHours.toFixed(2)} ={" "}
            {hours(pricing.hours)}
          </dd>

          <dt>Hours per working day</dt>
          <dd className="num">
            {pricing.hours.toFixed(2)} ÷ {pricing.workingDays} = {hours(pricing.hoursPerWorkingDay)}
          </dd>

          <dt>Cost</dt>
          <dd className={`num${unpricedTone}`}>
            {pricing.slices
              .map((slice) =>
                slice.hourlyCost === null
                  ? `${slice.workingDays} × ${pricing.hoursPerWorkingDay.toFixed(2)} × no rate`
                  : `${slice.workingDays} × ${pricing.hoursPerWorkingDay.toFixed(2)} × ${slice.hourlyCost}`,
              )
              .join(" + ")}{" "}
            = {pricing.slices.map((slice) => slice.cost.toFixed(2)).join(" + ")} ={" "}
            <strong>{euro(pricing.cost)}</strong>
            {pricing.unpricedDays > 0 && (
              <>
                {" "}
                <em>({pricing.unpricedDays} working days unpriced)</em>
              </>
            )}
          </dd>

          <dt>Same cell in % of capacity</dt>
          <dd className="num">{personMonthsToPercent(personMonths).toFixed(1)}%</dd>

          <dt>Across all projects</dt>
          <dd className={`num${flag ? " delivery-tone-over" : ""}`}>
            {flag ? `${flag.total.toFixed(2)} person-months, over capacity` : "within capacity"}
          </dd>

          <dt>Implied blended rate</dt>
          <dd className="num">
            {pricing.blendedRate === null ? "n/a" : `${euro(roundTo(pricing.blendedRate, 4), 4)}/h`}
          </dd>

          {currency.code !== "EUR" && (
            <>
              <dt>Cost in {currency.code}</dt>
              <dd className="num">
                {(pricing.cost * currency.perEur).toFixed(2)} at {currency.perEur} per euro
              </dd>
            </>
          )}
        </dl>
      )}
    </aside>
  );
}
