import { describe, expect, it } from "vitest";
import type { BreakdownItem, BreakdownItemId, ProjectId } from "../model";
import { buildTree, canAddChild, canMove, depthOf, descendantIds, subtreeHeight } from "../tree";

const project = "p1" as ProjectId;

function item(id: string, parentId: string | null, projectId = project): BreakdownItem {
  return {
    id: id as BreakdownItemId,
    projectId,
    parentId: parentId as BreakdownItemId | null,
    name: id,
  };
}

describe("buildTree", () => {
  it("nests children under parents with depth, in input order", () => {
    const tree = buildTree(
      [item("a", null), item("a1", "a"), item("a1x", "a1"), item("b", null), item("a2", "a")],
      project,
    );

    expect(tree.map((n) => n.item.id)).toEqual(["a", "b"]);
    expect(tree[0]?.children.map((n) => n.item.id)).toEqual(["a1", "a2"]);
    expect(tree[0]?.children[0]?.children[0]).toMatchObject({ depth: 3 });
  });

  it("only includes the requested project", () => {
    const tree = buildTree([item("a", null), item("z", null, "p2" as ProjectId)], project);
    expect(tree.map((n) => n.item.id)).toEqual(["a"]);
  });
});

describe("tree rules", () => {
  // a > a1 > a1x ; b
  const items = [item("a", null), item("a1", "a"), item("a1x", "a1"), item("b", null)];
  const id = (s: string) => s as BreakdownItemId;

  it("measures depth, height and descendants", () => {
    expect(depthOf(items, id("a1x"))).toBe(3);
    expect(subtreeHeight(items, id("a"))).toBe(3);
    expect(descendantIds(items, id("a"))).toEqual(new Set([id("a1"), id("a1x")]));
  });

  it("refuses a fourth level", () => {
    expect(canAddChild(items, id("a1x")).ok).toBe(false);
    expect(canAddChild(items, id("a1")).ok).toBe(true);
    expect(canAddChild(items, null).ok).toBe(true);
  });

  it("refuses moves that cycle, cross projects, or exceed the depth", () => {
    expect(canMove(items, id("a"), id("a1x")).ok).toBe(false);
    expect(canMove(items, id("a"), id("a")).ok).toBe(false);
    expect(canMove(items, id("a1"), id("b")).ok).toBe(true); // a1 has height 2, b is depth 1: 1 + 2 =  3, allowed
    expect(canMove(items, id("a"), id("b")).ok).toBe(false); // a has height 3: 1 + 3 = 4
    expect(canMove(items, id("a1x"), id("b")).ok).toBe(true);
    expect(canMove(items, id("a1x"), null).ok).toBe(true);
  });
});
