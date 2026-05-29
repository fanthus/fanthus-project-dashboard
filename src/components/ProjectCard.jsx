import { GitBranch } from 'lucide-react';
import { statusLabel } from '../utils/status';

function branchLabel(gitInfo) {
  if (!gitInfo) return null;
  if (gitInfo.isGit === false) return null;
  return gitInfo.branch || 'detached';
}

export default function ProjectCard({ project, selected, gitInfo, onClick }) {
  const branch = branchLabel(gitInfo);

  return (
    <button className={selected ? 'project-card selected' : 'project-card'} onClick={onClick}>
      <div className="project-card-row">
        <h2>{project.name}</h2>
        <div className="project-card-meta">
          <span className={`status-badge ${project.status}`}>{statusLabel(project.status)}</span>
          {branch && (
            <span className="project-card-branch" title={branch}>
              <GitBranch size={11} />
              {branch}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
