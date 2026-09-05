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
    <div className="delivery-project-row">
      <label htmlFor="project-select">Project </label>

      <select
        id="project-select"
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value as ProjectId)}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name} ({project.startDate} to {project.endDate})
          </option>
        ))}
      </select>
    </div>
  );
}
