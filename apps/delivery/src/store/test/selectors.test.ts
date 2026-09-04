import { loadSeed } from "@baseline/fixtures";
import type { BreakdownItemId, EmployeeId, Month, TreeNode } from "@baseline/domain";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it } from "vitest";
import { createDeliveryStore } from "../index";
import { selectAllProjects, selectCellPersonMonths, selectTreeForProject } from "../selectors";

describe("delivery selectors", () => {
  const state = createDeliveryStore({ seed: loadSeed(), persistence: memoryAdapter() }).getState();

  it("seeds four projects", () => {
    expect(selectAllProjects(state)).toHaveLength(4);
  });

  it("builds a tree no deeper than three levels for each project", () => {
    for (const project of selectAllProjects(state)) {
      const tree = selectTreeForProject(state, project.id);
      expect(tree.length).toBeGreaterThan(0);
      const deepest = (nodes: readonly TreeNode[]): number =>
        Math.max(...nodes.map((n) => (n.children.length ? deepest(n.children) : n.depth)));
      expect(deepest(tree)).toBeLessThanOrEqual(3);
    }
  });

  it("finds the reference cell in the seed", () => {
    const cell = {
      itemId: "wbs-012" as BreakdownItemId,
      employeeId: "emp-001" as EmployeeId,
      month: "2026-03" as Month,
    };
    expect(selectCellPersonMonths(state, cell)).toBe(0.5);
  });
});
