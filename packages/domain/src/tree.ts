import type { BreakdownItem, BreakdownItemId, ProjectId } from "./model";

export const MAX_TREE_DEPTH = 3;

export interface TreeNode {
  readonly item: BreakdownItem;
  readonly depth: number; // 1 for a root, 2 for its children, 3 for grandchildren
  readonly children: readonly TreeNode[];
}

// Builds the tree for one project from flat items, preserving input order
// Items whose parent is missing are skipped rather than shown at the wrong level
export function buildTree(items: readonly BreakdownItem[], projectId: ProjectId): TreeNode[] {
  const byParent = new Map<BreakdownItemId | null, BreakdownItem[]>();

  for (const item of items) {
    if (item.projectId !== projectId) continue;

    const siblings = byParent.get(item.parentId) ?? [];
    siblings.push(item);
    byParent.set(item.parentId, siblings);
  }

  const build = (parentId: BreakdownItemId | null, depth: number): TreeNode[] =>
    (byParent.get(parentId) ?? []).map((item) => ({
      item,
      depth,
      children: build(item.id, depth + 1),
    }));

  return build(null, 1);
}
