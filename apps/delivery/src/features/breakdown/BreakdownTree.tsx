import {
  MAX_TREE_DEPTH,
  type BreakdownItemId,
  type ProjectId,
  type TreeNode,
} from "@baseline/domain";
import { useState } from "react";
import { itemAdded, itemDeleted, itemMoved, itemRenamed } from "../../store/breakdownItemsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectAllocationCountForItem,
  selectDeleteImpact,
  selectMoveTargets,
  selectTreeForProject,
} from "../../store/selectors";

interface BreakdownTreeProps {
  readonly projectId: ProjectId;
}

/** Sentinel option value for "move to root", since an empty value is the placeholder. */
const ROOT_TARGET = "__root__";

export function BreakdownTree({ projectId }: BreakdownTreeProps) {
  const tree = useAppSelector((state) => selectTreeForProject(state, projectId));

  return (
    <section className="card delivery-tree" aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading" className="eyebrow">
        Work breakdown
      </h2>
      <NameForm
        placeholder="New root work package"
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
  const canHaveChildren = node.depth < MAX_TREE_DEPTH;
  const allocationsHere = useAppSelector((state) =>
    selectAllocationCountForItem(state, node.item.id),
  );
  const impact = useAppSelector((state) => selectDeleteImpact(state, node.item.id));
  const [mode, setMode] = useState<"view" | "rename" | "add" | "confirmDelete">("view");
  const [notice, setNotice] = useState<string | null>(null);

  const deleteQuestion = [
    `Delete ${node.item.name}`,
    impact.items > 1 ? ` and ${impact.items - 1} sub-item${impact.items === 2 ? "" : "s"}` : "",
    impact.allocations > 0
      ? `, removing ${impact.allocations} allocation${impact.allocations === 1 ? "" : "s"}`
      : "",
    "?",
  ].join("");

  return (
    <li>
      <div className="delivery-tree-row">
        {mode === "rename" && (
          <InlineInput
            initial={node.item.name}
            placeholder="New name"
            submitLabel="Save"
            onSubmit={(name) => {
              dispatch(itemRenamed({ id: node.item.id, name }));
              setMode("view");
            }}
            onCancel={() => setMode("view")}
          />
        )}

        {mode === "add" && (
          <InlineInput
            initial=""
            placeholder="Name of new child"
            submitLabel="Add"
            onSubmit={(name) => {
              dispatch(itemAdded({ projectId, parentId: node.item.id, name }));
              if (allocationsHere > 0) {
                setNotice(
                  `${allocationsHere} allocation${allocationsHere === 1 ? "" : "s"} moved from ${node.item.name} to ${name}.`,
                );
              }
              setMode("view");
            }}
            onCancel={() => setMode("view")}
          />
        )}

        {mode === "confirmDelete" && (
          <div
            className="delivery-tree-confirm"
            role="alertdialog"
            aria-label={`Delete ${node.item.name}`}
          >
            <span>{deleteQuestion}</span>
            <button
              type="button"
              className="btn-danger"
              onClick={() => dispatch(itemDeleted(node.item.id))}
            >
              Confirm
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode("view")}>
              Cancel
            </button>
          </div>
        )}

        {mode === "view" && (
          <>
            <span className="delivery-tree-name">{node.item.name}</span>
            <span className="delivery-spacer" />
            <span role="toolbar" aria-label={`${node.item.name} actions`}>
              <button
                type="button"
                className="delivery-tree-tool"
                onClick={() => setMode("rename")}
              >
                Rename
              </button>
              {canHaveChildren && (
                <button type="button" className="delivery-tree-tool" onClick={() => setMode("add")}>
                  Add child
                </button>
              )}
              <select
                className="delivery-tree-move"
                aria-label={`Move ${node.item.name} to`}
                value=""
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "") return;
                  dispatch(
                    itemMoved({
                      id: node.item.id,
                      parentId: value === ROOT_TARGET ? null : (value as BreakdownItemId),
                    }),
                  );
                }}
              >
                <option value="">Move to…</option>
                <option value={ROOT_TARGET}>(root)</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="delivery-tree-tool delivery-tree-tool--danger"
                onClick={() => setMode("confirmDelete")}
              >
                Delete
              </button>
            </span>
          </>
        )}
      </div>

      {notice && (
        <p role="status" className="notice-warning delivery-notice">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </p>
      )}

      {node.children.length > 0 && <TreeList nodes={node.children} projectId={projectId} />}
    </li>
  );
}

function InlineInput({
  initial,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  readonly initial: string;
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly onSubmit: (value: string) => void;
  readonly onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className="delivery-tree-edit"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim() !== "") onSubmit(value.trim());
      }}
    >
      <input
        className="field"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus
      />
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

function NameForm({
  placeholder,
  onSubmit,
}: {
  readonly placeholder: string;
  readonly onSubmit: (name: string) => Parameters<typeof itemAdded>[0];
}) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  return (
    <form
      className="delivery-tree-add"
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim() === "") return;
        dispatch(itemAdded(onSubmit(name.trim())));
        setName("");
      }}
    >
      <input
        className="field"
        aria-label={placeholder}
        placeholder={placeholder}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button type="submit" className="btn-secondary">
        Add
      </button>
    </form>
  );
}
