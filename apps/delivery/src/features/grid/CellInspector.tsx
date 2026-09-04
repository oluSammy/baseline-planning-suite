import { personMonthsToPercent, priceAllocation, roundTo } from "@baseline/domain";
import { useMemo } from "react";
import { useAppSelector } from "../../store/hooks";
import { selectCellPersonMonths, selectPeopleLookup, type CellRef } from "../../store/selectors";

interface CellInspectorProps {
  readonly cell: CellRef;
  readonly itemName: string;
  readonly onClose: () => void;
}

const euro = (value: number, dp = 2) => `€${value.toFixed(dp)}`;
const hours = (value: number) => `${value.toFixed(2)} h`;

export function CellInspector({ cell, itemName, onClose }: CellInspectorProps) {
  const personMonths = useAppSelector((state) => selectCellPersonMonths(state, cell));
  const people = useAppSelector(selectPeopleLookup);
  const employee = people.employees.get(cell.employeeId);
  const rateRecords = people.ratesByEmployee.get(cell.employeeId) ?? [];

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

  return (
    <aside aria-labelledby="inspector-heading">
      <header>
        <h3 id="inspector-heading">
          {employee?.name ?? cell.employeeId} · {itemName} · {cell.month}
        </h3>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </header>

      {!employee || !pricing ? (
        <p role="status">People register unavailable, so this cell cannot be priced.</p>
      ) : (
        <dl>
          <dt>Inputs</dt>
          <dd>
            {employee.weeklyHours} h/week. Rates:{" "}
            {rateRecords.length === 0
              ? "none"
              : [...rateRecords]
                  .sort((a, b) => a.validFrom.localeCompare(b.validFrom))
                  .map((r) => `${euro(r.hourlyCost)}/h from ${r.validFrom}`)
                  .join(", ")}
            . This cell: {personMonths.toFixed(2)} person-months.
          </dd>

          <dt>Working days in {cell.month}</dt>
          <dd>{pricing.workingDays}</dd>

          <dt>Slices</dt>
          <dd>
            <ul>
              {pricing.slices.map((slice) => (
                <li key={slice.from}>
                  {slice.from} to {slice.to}: {slice.workingDays} working days at{" "}
                  {slice.hourlyCost === null ? "no rate" : `${euro(slice.hourlyCost)}/h`}
                </li>
              ))}
            </ul>
          </dd>

          <dt>One person-month</dt>
          <dd>
            {employee.weeklyHours} × {pricing.workingDays} ÷ 5 = {hours(pricing.personMonthHours)}
          </dd>

          <dt>This allocation in hours</dt>
          <dd>
            {personMonths.toFixed(2)} × {pricing.personMonthHours.toFixed(2)} ={" "}
            {hours(pricing.hours)}
          </dd>

          <dt>Hours per working day</dt>
          <dd>
            {pricing.hours.toFixed(2)} ÷ {pricing.workingDays} = {hours(pricing.hoursPerWorkingDay)}
          </dd>

          <dt>Cost</dt>
          <dd>
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
          <dd>{personMonthsToPercent(personMonths).toFixed(1)}%</dd>

          <dt>Implied blended rate</dt>
          <dd>
            {pricing.blendedRate === null ? "n/a" : `${euro(roundTo(pricing.blendedRate, 4), 4)}/h`}
          </dd>
        </dl>
      )}
    </aside>
  );
}
