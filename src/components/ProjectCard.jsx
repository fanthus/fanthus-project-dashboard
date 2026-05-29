import { statusLabel } from '../utils/status';

export default function ProjectCard({ project, selected, onClick }) {
  return (
    <button className={selected ? 'project-card selected' : 'project-card'} onClick={onClick}>
      <div className="project-card-row">
        <h2>{project.name}</h2>
        <span className={`status-badge ${project.status}`}>{statusLabel(project.status)}</span>
      </div>
    </button>
  );
}
