import {
  canAddChild,
  canMove,
  descendantIds,
  type BreakdownItem,
  type BreakdownItemId,
  type ProjectId,
} from "@baseline/domain";
import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const breakdownItemsAdapter = createEntityAdapter<BreakdownItem, BreakdownItemId>({
  selectId: (item) => item.id,
});

const { selectAll } = breakdownItemsAdapter.getSelectors();

export interface NewItem {
  readonly projectId: ProjectId;
  readonly parentId: BreakdownItemId | null;
  readonly name: string;
}

export const breakdownItemsSlice = createSlice({
  name: "breakdownItems",
  initialState: breakdownItemsAdapter.getInitialState(),
  reducers: {
    itemAdded: {
      prepare(input: NewItem) {
        return { payload: { id: crypto.randomUUID() as BreakdownItemId, ...input } };
      },
      reducer(state, action: PayloadAction<BreakdownItem>) {
        if (!canAddChild(selectAll(state), action.payload.parentId).ok) return;
        breakdownItemsAdapter.addOne(state, action.payload);
      },
    },

    itemRenamed(state, action: PayloadAction<{ id: BreakdownItemId; name: string }>) {
      const name = action.payload.name.trim();
      if (name === "") return;
      breakdownItemsAdapter.updateOne(state, { id: action.payload.id, changes: { name } });
    },

    itemMoved(
      state,
      action: PayloadAction<{ id: BreakdownItemId; parentId: BreakdownItemId | null }>,
    ) {
      const { id, parentId } = action.payload;
      if (!canMove(selectAll(state), id, parentId).ok) return;
      breakdownItemsAdapter.updateOne(state, { id, changes: { parentId } });
    },

    itemDeleted(state, action: PayloadAction<BreakdownItemId>) {
      const doomed = descendantIds(selectAll(state), action.payload);
      doomed.add(action.payload);
      breakdownItemsAdapter.removeMany(state, [...doomed]);
    },
  },
});

export const { itemAdded, itemRenamed, itemMoved, itemDeleted } = breakdownItemsSlice.actions;
export const breakdownItemsReducer = breakdownItemsSlice.reducer;
