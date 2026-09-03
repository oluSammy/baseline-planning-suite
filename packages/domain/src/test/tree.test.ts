import { describe, expect, it } from "vitest";
import type { BreakdownItem, BreakdownItemId, ProjectId } from "../model";
import { buildTree } from "../tree";

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
