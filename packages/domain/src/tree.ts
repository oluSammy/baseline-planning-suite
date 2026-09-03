import type { BreakdownItem, BreakdownItemId, ProjectId } from "./model";

export const MAX_TREE_DEPTH = 3;

//  Why an edit is refused, or nothing when it is allowed
export type TreeRuleResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };

const OK: TreeRuleResult = { ok: true };

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

function byId(items: readonly BreakdownItem[]): Map<BreakdownItemId, BreakdownItem> {
  return new Map(items.map((item) => [item.id, item]));
}

// 1 for a root, counting up through parents.
export function depthOf(items: readonly BreakdownItem[], id: BreakdownItemId): number {
  const lookup = byId(items);
  let depth = 0;

  for (
    let current = lookup.get(id);
    current;
    current = current.parentId === null ? undefined : lookup.get(current.parentId)
  ) {
    depth += 1;
  }
  return depth;
}

// Every item below `id`, at any level. Does not include `id` itself
export function descendantIds(
  items: readonly BreakdownItem[],
  id: BreakdownItemId,
): Set<BreakdownItemId> {
  const result = new Set<BreakdownItemId>();
  const frontier: BreakdownItemId[] = [id];
  while (frontier.length > 0) {
    const parent = frontier.pop();
    for (const item of items) {
      if (item.parentId === parent && !result.has(item.id)) {
        result.add(item.id);
        frontier.push(item.id);
      }
    }
  }
  return result;
}

// Number of levels in the subtree rooted at `id`, counting `id` as 1
export function subtreeHeight(items: readonly BreakdownItem[], id: BreakdownItemId): number {
  const children = items.filter((item) => item.parentId === id);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((child) => subtreeHeight(items, child.id)));
}

export function canAddChild(
  items: readonly BreakdownItem[],
  parentId: BreakdownItemId | null,
): TreeRuleResult {
  if (parentId === null) return OK;
  if (depthOf(items, parentId) >= MAX_TREE_DEPTH) {
    return { ok: false, reason: `Work breakdown is limited to ${MAX_TREE_DEPTH} levels.` };
  }
  return OK;
}

export function canMove(
  items: readonly BreakdownItem[],
  id: BreakdownItemId,
  newParentId: BreakdownItemId | null,
): TreeRuleResult {
  const lookup = byId(items);
  const item = lookup.get(id);
  if (!item) return { ok: false, reason: "Item not found." };
  if (newParentId === item.parentId) return OK;
  if (newParentId === id) return { ok: false, reason: "An item cannot be its own parent." };

  if (newParentId !== null) {
    const parent = lookup.get(newParentId);
    if (!parent) return { ok: false, reason: "Target parent not found." };
    if (parent.projectId !== item.projectId)
      return { ok: false, reason: "Items cannot move between projects." };
    if (descendantIds(items, id).has(newParentId)) {
      return { ok: false, reason: "An item cannot move inside its own subtree." };
    }

    if (depthOf(items, newParentId) + subtreeHeight(items, id) > MAX_TREE_DEPTH) {
      return { ok: false, reason: `Moving here would exceed ${MAX_TREE_DEPTH} levels.` };
    }
  }

  return OK;
}
