import type { BreakdownItemId, ProjectId } from "@baseline/domain";
import { describe, expect, it } from "vitest";
import {
  breakdownItemsReducer,
  itemAdded,
  itemDeleted,
  itemMoved,
  itemRenamed,
} from "../breakdownItemsSlice";

const projectId = "p1" as ProjectId;
const id = (s: string) => s as BreakdownItemId;

function stateWith(...entries: Array<[string, string | null]>) {
  return entries.reduce(
    (state, [itemId, parentId]) =>
      breakdownItemsReducer(state, {
        type: itemAdded.type,
        payload: {
          id: id(itemId),
          projectId,
          parentId: parentId === null ? null : id(parentId),
          name: itemId,
        },
      }),
    breakdownItemsReducer(undefined, { type: "@@init" }),
  );
}

describe("breakdownItems reducers", () => {
  it("adds up to three levels and refuses a fourth", () => {
    const state = stateWith(["a", null], ["a1", "a"], ["a1x", "a1"], ["a1xx", "a1x"]);
    expect(state.ids).toEqual(["a", "a1", "a1x"]);
  });

  it("renames, ignoring blank names", () => {
    const before = stateWith(["a", null]);
    expect(
      breakdownItemsReducer(before, itemRenamed({ id: id("a"), name: "  Ledger  " })).entities[
        id("a")
      ]?.name,
    ).toBe("Ledger");
    expect(breakdownItemsReducer(before, itemRenamed({ id: id("a"), name: "   " }))).toBe(before);
  });

  it("moves when the rules allow and refuses otherwise", () => {
    const before = stateWith(["a", null], ["a1", "a"], ["b", null]);
    expect(
      breakdownItemsReducer(before, itemMoved({ id: id("a1"), parentId: id("b") })).entities[
        id("a1")
      ]?.parentId,
    ).toBe("b");
    expect(breakdownItemsReducer(before, itemMoved({ id: id("a"), parentId: id("a1") }))).toBe(
      before,
    );
  });

  it("deletes the whole subtree", () => {
    const state = breakdownItemsReducer(
      stateWith(["a", null], ["a1", "a"], ["a1x", "a1"], ["b", null]),
      itemDeleted(id("a")),
    );
    expect(state.ids).toEqual(["b"]);
  });
});
