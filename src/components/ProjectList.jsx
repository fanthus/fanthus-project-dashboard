import { Search } from 'lucide-react';
import ProjectCard from './ProjectCard';

export default function ProjectList({ projects, selectedId, loading, search, setSearch, gitInfo, onSelect }) {
  const query = search.trim();

  return (
    <main className="project-list-panel" aria-label="项目列表">
      <div className="list-header">
        <header className="list-toolbar panel-heading">
          <div>
            <p>Projects</p>
            <h1>本地项目全貌</h1>
          </div>
          <span>{projects.length} 个项目</span>
        </header>

        <label className="search-box list-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索名称、文件夹、标签"
          />
        </label>
      </div>

      <div className="project-list">
        {loading && <div className="empty-state">正在读取本地项目库...</div>}
        {!loading && !projects.length && !query && (
          <div className="empty-state">
            <strong>还没有项目</strong>
            <span>把项目文件夹拖进窗口，或用“选择文件夹”直接添加。</span>
          </div>
        )}
        {!loading && !projects.length && query && (
          <div className="empty-state">
            <strong>没有匹配的项目</strong>
            <span>试试其他关键字，或清除搜索条件。</span>
          </div>
        )}
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={project.id === selectedId}
            gitInfo={gitInfo[project.id]}
            onClick={() => onSelect(project.id)}
          />
        ))}
      </div>
    </main>
  );
}
