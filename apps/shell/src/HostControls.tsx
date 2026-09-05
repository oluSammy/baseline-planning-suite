import type { PeopleApi } from "@baseline/contracts";
import type { Employee, EmployeeId } from "@baseline/domain";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { activeUserChanged, CURRENCIES, currencyChanged } from "./store/hostSlice";

interface HostControlsProps {
  readonly peopleApi: PeopleApi | null;
}

/** Display currency and active user. The shell owns both; remotes only read them. */
export function HostControls({ peopleApi }: HostControlsProps) {
  const dispatch = useAppDispatch();
  const { currency, activeUser } = useAppSelector((state) => state.host);
  const [employees, setEmployees] = useState<readonly Employee[]>([]);

  useEffect(() => {
    if (!peopleApi) return;
    setEmployees(peopleApi.snapshot().employees);
    return peopleApi.subscribe((snapshot) => setEmployees(snapshot.employees));
  }, [peopleApi]);

  return (
    <div className="shell-controls" role="group" aria-label="Display settings">
      <label>
        Currency
        <select
          className="field"
          value={currency.code}
          onChange={(event) => {
            const next = CURRENCIES.find((c) => c.code === event.target.value);
            if (next) dispatch(currencyChanged(next));
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </label>
      <label>
        Editing as
        <select
          className="field"
          value={activeUser ?? ""}
          disabled={!peopleApi}
          onChange={(event) =>
            dispatch(
              activeUserChanged(
                event.target.value === "" ? null : (event.target.value as EmployeeId),
              ),
            )
          }
        >
          <option value="">{peopleApi ? "Nobody" : "People unavailable"}</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
