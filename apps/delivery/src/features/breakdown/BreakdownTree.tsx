import type { ProjectId, TreeNode } from "@baseline/domain";
import { useAppSelector } from "../../store/hooks";
import { selectTreeForProject } from "../../store/selectors";

interface BreakdownTreeProps {
  readonly projectId: ProjectId;
}

export function BreakdownTree({ projectId }: BreakdownTreeProps) {
  const tree = useAppSelector((state) => selectTreeForProject(state, projectId));

  return (
    <section aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading">Work breakdown</h2>
      {tree.length === 0 ? <p>No work packages yet.</p> : <TreeList nodes={tree} />}
    </section>
  );
}

function TreeList({ nodes }: { readonly nodes: readonly TreeNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.item.id}>
          {node.item.name}
          {node.children.length > 0 && <TreeList nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}
