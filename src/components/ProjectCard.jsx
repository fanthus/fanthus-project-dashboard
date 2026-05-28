import { AlertCircle, CheckCircle2, GitBranch, MapPin } from 'lucide-react';
import { statusLabel } from '../utils/status';

export default function ProjectCard({ project, selected, gitInfo, onClick }) {
  const nextSteps = project.nextSteps?.trim() || '未设置下一步计划';

  return (
    <button className={selected ? 'project-card selected' : 'project-card'} onClick={onClick}>
      <div className="project-card-top">
        <div>
          <div className="project-title-row">
            <h2>{project.name}</h2>
            <span className={`status-badge ${project.status}`}>{statusLabel(project.status)}</span>
          </div>
          <p>{project.description || '暂无描述'}</p>
        </div>
      </div>

      <div className="tag-row">
        {(project.tags ?? []).slice(0, 5).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="card-meta">
        <span title={project.path}>
          <MapPin size={14} />
          {project.path}
        </span>
        <span>
          <GitBranch size={14} />
          {gitInfo?.branch || (gitInfo?.isGit === false ? '非 Git' : 'Git 待刷新')}
        </span>
        <span className={gitInfo?.hasChanges ? 'dirty' : 'clean'}>
          {gitInfo?.hasChanges ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {gitInfo?.hasChanges ? '有未提交变更' : '工作区干净'}
        </span>
      </div>

      <div className="next-step">
        <small>Next</small>
        <span>{nextSteps}</span>
      </div>
    </button>
  );
}
