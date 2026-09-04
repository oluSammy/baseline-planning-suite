import {
  month,
  personMonths,
  type AllocationId,
  type EmployeeId,
  type ProjectId,
} from "@baseline/domain";
import { loadSeed } from "@baseline/fixtures";
import { memoryAdapter } from "@baseline/persistence";
import { describe, expect, it } from "vitest";
import { allocationSet } from "../allocationsSlice";
import { itemAdded, itemDeleted } from "../breakdownItemsSlice";
import { createDeliveryStore } from "../index";
import { selectAllAllocations, selectAllBreakdownItems } from "../selectors";

const projectId = "prj-1" as ProjectId;
const emp = "emp-001" as EmployeeId;
const june = month("2026-06");

/** A fresh store with a new root, a leaf under it, and one allocation planted on the leaf. */
function storeWithLeafAllocation() {
  const store = createDeliveryStore({ seed: loadSeed(), persistence: memoryAdapter() });

  store.dispatch(itemAdded({ projectId, parentId: null, name: "Root" }));
  const root = selectAllBreakdownItems(store.getState()).find((i) => i.name === "Root");
  if (!root) throw new Error("root missing");

  store.dispatch(itemAdded({ projectId, parentId: root.id, name: "Leaf" }));
  const leaf = selectAllBreakdownItems(store.getState()).find((i) => i.name === "Leaf");
  if (!leaf) throw new Error("leaf missing");

  store.dispatch(
    allocationSet({ itemId: leaf.id, employeeId: emp, month: june, amount: personMonths(0.5) }),
  );
  const planted = selectAllAllocations(store.getState()).find((a) => a.breakdownItemId === leaf.id);
  if (!planted) throw new Error("allocation missing");

  return { store, root, leaf, plantedId: planted.id };
}

type Store = ReturnType<typeof storeWithLeafAllocation>["store"];

function findPlanted(store: Store, id: AllocationId) {
  return selectAllAllocations(store.getState()).find((a) => a.id === id);
}

describe("cross-slice rules", () => {
  it("R4: adding a child under a leaf moves the leaf's allocations onto the child", () => {
    const { store, leaf, plantedId } = storeWithLeafAllocation();

    store.dispatch(itemAdded({ projectId, parentId: leaf.id, name: "Child" }));
    const child = selectAllBreakdownItems(store.getState()).find((i) => i.name === "Child");
    if (!child) throw new Error("child missing");

    expect(findPlanted(store, plantedId)?.breakdownItemId).toBe(child.id);
  });

  it("moves nothing when the add is refused by the depth rule", () => {
    const { store, leaf } = storeWithLeafAllocation();
    store.dispatch(itemAdded({ projectId, parentId: leaf.id, name: "Child" }));
    const child = selectAllBreakdownItems(store.getState()).find((i) => i.name === "Child");
    if (!child) throw new Error("child missing");
    const before = selectAllAllocations(store.getState());

    // Root → Leaf → Child is three levels; a fourth is refused.
    store.dispatch(itemAdded({ projectId, parentId: child.id, name: "Too deep" }));

    expect(selectAllBreakdownItems(store.getState()).some((i) => i.name === "Too deep")).toBe(
      false,
    );
    expect(selectAllAllocations(store.getState())).toEqual(before);
  });

  it("deleting a subtree removes its allocations and nothing else", () => {
    const { store, root, plantedId } = storeWithLeafAllocation();
    const countBefore = selectAllAllocations(store.getState()).length;

    store.dispatch(itemDeleted(root.id));

    expect(selectAllBreakdownItems(store.getState()).some((i) => i.name === "Leaf")).toBe(false);
    expect(findPlanted(store, plantedId)).toBeUndefined();
    expect(selectAllAllocations(store.getState())).toHaveLength(countBefore - 1);
  });
});
