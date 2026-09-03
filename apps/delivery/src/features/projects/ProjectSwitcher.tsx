import type { ProjectId } from "@baseline/domain";
import { useAppSelector } from "../../store/hooks";
import { selectAllProjects } from "../../store/selectors";

interface ProjectSwitcherProps {
  readonly value: ProjectId;
  readonly onChange: (projectId: ProjectId) => void;
}

export function ProjectSwitcher({ value, onChange }: ProjectSwitcherProps) {
  const projects = useAppSelector(selectAllProjects);

  return (
    <label>
      Project
      <select value={value} onChange={(event) => onChange(event.target.value as ProjectId)}>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.startDate} to {project.endDate})
          </option>
        ))}
      </select>
    </label>
  );
}
