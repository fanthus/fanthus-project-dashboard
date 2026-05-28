import { Archive, CircleDot, FolderPlus, Plus, Search, Tag } from 'lucide-react';
import { STATUS_OPTIONS } from '../utils/status';

export default function Sidebar({
  projects,
  allTags,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter,
  onAddProject,
  onChooseFolder,
}) {
  const statusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">D</div>
        <div>
          <p>ProjectDashboard</p>
          <strong>DevDash</strong>
        </div>
      </div>

      <div className="quick-actions">
        <button className="primary-button" onClick={onAddProject}>
          <Plus size={16} />
          添加项目
        </button>
        <button className="ghost-button" onClick={onChooseFolder}>
          <FolderPlus size={16} />
          选择文件夹
        </button>
      </div>

      <label className="search-box">
        <Search size={16} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索名称、路径、标签"
        />
      </label>

      <section className="filter-group">
        <div className="filter-title">
          <CircleDot size={15} />
          状态
        </div>
        <button
          className={statusFilter === 'all' ? 'filter-row selected' : 'filter-row'}
          onClick={() => setStatusFilter('all')}
        >
          <span>全部项目</span>
          <em>{projects.length}</em>
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            className={statusFilter === status.value ? 'filter-row selected' : 'filter-row'}
            onClick={() => setStatusFilter(status.value)}
          >
            <span>{status.label}</span>
            <em>{statusCounts[status.value] ?? 0}</em>
          </button>
        ))}
      </section>

      <section className="filter-group tag-filter">
        <div className="filter-title">
          <Tag size={15} />
          标签
        </div>
        <button
          className={tagFilter === 'all' ? 'filter-row selected' : 'filter-row'}
          onClick={() => setTagFilter('all')}
        >
          <span>全部标签</span>
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            className={tagFilter === tag ? 'filter-row selected' : 'filter-row'}
            onClick={() => setTagFilter(tag)}
          >
            <span>{tag}</span>
          </button>
        ))}
        {!allTags.length && <p className="empty-note">标签不会自动识别，可在编辑项目时手动维护。</p>}
      </section>

      <div className="storage-note">
        <Archive size={15} />
        <span>元数据保存在 ~/.devdash/projects.json</span>
      </div>
    </aside>
  );
}
