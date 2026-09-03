import { hourlyCost, isoDate, type EmployeeId, type RateRecordId } from "@baseline/domain";
import { describe, expect, it } from "vitest";
import { rateAdded, rateCorrected, rateRecordsReducer, rateRemoved } from "../rateRecordsSlice";

const employeeId = "emp-001" as EmployeeId;

function stateWith(...entries: Array<[string, string, number]>) {
  return entries.reduce(
    (state, [id, validFrom, cost]) =>
      rateRecordsReducer(state, {
        type: rateAdded.type,
        payload: {
          id: id as RateRecordId,
          employeeId,
          validFrom: isoDate(validFrom),
          hourlyCost: hourlyCost(cost),
        },
      }),
    rateRecordsReducer(undefined, { type: "@@init" }),
  );
}

describe("rateRecords reducers", () => {
  it("adds a rate, including retroactively", () => {
    const state = stateWith(["r1", "2025-01-01", 80], ["r0", "2024-06-01", 70]);
    expect(state.ids).toHaveLength(2);
  });

  it("refuses a second rate on the same start day", () => {
    const state = stateWith(["r1", "2025-01-01", 80], ["r2", "2025-01-01", 90]);
    expect(state.ids).toEqual(["r1"]);
  });

  it("corrects date and cost", () => {
    const before = stateWith(["r1", "2025-01-01", 80]);
    const after = rateRecordsReducer(
      before,
      rateCorrected({
        id: "r1" as RateRecordId,
        validFrom: isoDate("2025-02-01"),
        hourlyCost: hourlyCost(85),
      }),
    );
    expect(after.entities["r1" as RateRecordId]).toMatchObject({
      validFrom: "2025-02-01",
      hourlyCost: 85,
    });
  });

  it("refuses a correction that collides with another rate", () => {
    const before = stateWith(["r1", "2025-01-01", 80], ["r2", "2026-03-12", 95]);
    const after = rateRecordsReducer(
      before,
      rateCorrected({
        id: "r1" as RateRecordId,
        validFrom: isoDate("2026-03-12"),
        hourlyCost: hourlyCost(80),
      }),
    );
    expect(after).toBe(before);
  });

  it("removes a rate", () => {
    const before = stateWith(["r1", "2025-01-01", 80]);
    expect(rateRecordsReducer(before, rateRemoved("r1" as RateRecordId)).ids).toEqual([]);
  });
});
