import ProjectCard from './ProjectCard';

export default function ProjectList({ projects, selectedId, loading, onSelect }) {
  return (
    <main className="project-list-panel" aria-label="项目列表">
      <header className="list-toolbar panel-heading">
        <div>
          <p>Projects</p>
          <h1>本地项目全貌</h1>
        </div>
        <span>{projects.length} 个项目</span>
      </header>

      <div className="project-list">
        {loading && <div className="empty-state">正在读取本地项目库...</div>}
        {!loading && !projects.length && (
          <div className="empty-state">
            <strong>还没有项目</strong>
            <span>把项目文件夹拖进窗口，或用“选择文件夹”直接添加。</span>
          </div>
        )}
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={project.id === selectedId}
            onClick={() => onSelect(project.id)}
          />
        ))}
      </div>
    </main>
  );
}
