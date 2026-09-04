import {
  MAX_TREE_DEPTH,
  type BreakdownItemId,
  type ProjectId,
  type TreeNode,
} from "@baseline/domain";
import { useState } from "react";
import { itemAdded, itemDeleted, itemMoved, itemRenamed } from "../../store/breakdownItemsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectMoveTargets, selectTreeForProject } from "../../store/selectors";

interface BreakdownTreeProps {
  readonly projectId: ProjectId;
}

export function BreakdownTree({ projectId }: BreakdownTreeProps) {
  const tree = useAppSelector((state) => selectTreeForProject(state, projectId));

  return (
    <section aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading">Work breakdown</h2>
      <NameForm
        label="Add work package"
        onSubmit={(name) => ({ projectId, parentId: null, name })}
      />
      {tree.length === 0 ? (
        <p>No work packages yet.</p>
      ) : (
        <TreeList nodes={tree} projectId={projectId} />
      )}
    </section>
  );
}

function TreeList({
  nodes,
  projectId,
}: {
  readonly nodes: readonly TreeNode[];
  readonly projectId: ProjectId;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <TreeItem key={node.item.id} node={node} projectId={projectId} />
      ))}
    </ul>
  );
}

function TreeItem({ node, projectId }: { readonly node: TreeNode; readonly projectId: ProjectId }) {
  const dispatch = useAppDispatch();
  const targets = useAppSelector((state) => selectMoveTargets(state, node.item.id));
  const [mode, setMode] = useState<"view" | "rename" | "add">("view");
  const canHaveChildren = node.depth < MAX_TREE_DEPTH;

  return (
    <li>
      {mode === "rename" ? (
        <InlineInput
          initial={node.item.name}
          submitLabel="Save"
          onSubmit={(name) => {
            dispatch(itemRenamed({ id: node.item.id, name }));
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      ) : (
        <span>{node.item.name}</span>
      )}

      {mode === "view" && (
        <span role="toolbar" aria-label={`${node.item.name} actions`}>
          <button type="button" onClick={() => setMode("rename")}>
            Rename
          </button>
          {canHaveChildren && (
            <button type="button" onClick={() => setMode("add")}>
              Add child
            </button>
          )}
          <label>
            Move to
            <select
              value=""
              onChange={(event) => {
                const value = event.target.value;
                dispatch(
                  itemMoved({
                    id: node.item.id,
                    parentId: value === "" ? null : (value as BreakdownItemId),
                  }),
                );
              }}
            >
              <option value="">(root)</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => dispatch(itemDeleted(node.item.id))}>
            Delete
          </button>
        </span>
      )}

      {mode === "add" && (
        <InlineInput
          initial=""
          submitLabel="Add"
          onSubmit={(name) => {
            dispatch(itemAdded({ projectId, parentId: node.item.id, name }));
            setMode("view");
          }}
          onCancel={() => setMode("view")}
        />
      )}

      {node.children.length > 0 && <TreeList nodes={node.children} projectId={projectId} />}
    </li>
  );
}

function InlineInput({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  readonly initial: string;
  readonly submitLabel: string;
  readonly onSubmit: (value: string) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() !== "") onSubmit(value.trim());
      }}
    >
      <input value={value} onChange={(event) => setValue(event.target.value)} autoFocus />
      <button type="submit">{submitLabel}</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

function NameForm({
  label,
  onSubmit,
}: {
  readonly label: string;
  readonly onSubmit: (name: string) => Parameters<typeof itemAdded>[0];
}) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim() === "") return;
        dispatch(itemAdded(onSubmit(name.trim())));
        setName("");
      }}
    >
      <label>
        {label}
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="submit">Add</button>
    </form>
  );
}
