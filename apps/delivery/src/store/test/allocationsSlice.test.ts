import { month, personMonths, type BreakdownItemId, type EmployeeId } from "@baseline/domain";
import { describe, expect, it } from "vitest";
import { allocationSet, allocationsReducer } from "../allocationsSlice";

const cell = {
  itemId: "leaf" as BreakdownItemId,
  employeeId: "e1" as EmployeeId,
  month: month("2026-03"),
};
const init = allocationsReducer(undefined, { type: "@@init" });

describe("allocationSet", () => {
  it("creates, updates and clears one cell", () => {
    const created = allocationsReducer(init, allocationSet({ ...cell, amount: personMonths(0.5) }));
    expect(created.ids).toHaveLength(1);

    const updated = allocationsReducer(
      created,
      allocationSet({ ...cell, amount: personMonths(0.75) }),
    );
    expect(updated.ids).toHaveLength(1);
    expect(Object.values(updated.entities)[0]?.amount).toBe(0.75);

    const cleared = allocationsReducer(
      updated,
      allocationSet({ ...cell, amount: personMonths(0) }),
    );
    expect(cleared.ids).toHaveLength(0);
  });

  it("keeps other cells untouched", () => {
    const a = allocationsReducer(init, allocationSet({ ...cell, amount: personMonths(0.5) }));
    const b = allocationsReducer(
      a,
      allocationSet({ ...cell, month: month("2026-04"), amount: personMonths(0.25) }),
    );
    expect(b.ids).toHaveLength(2);
  });
});
