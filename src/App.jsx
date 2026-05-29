import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { FolderPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProjectDetail from './components/ProjectDetail';
import ProjectFormModal from './components/ProjectFormModal';
import ProjectList from './components/ProjectList';
import Sidebar from './components/Sidebar';
import { useAutostart } from './hooks/useAutostart';
import { useProjects } from './hooks/useProjects';
import { emptyProject } from './utils/status';

export default function App() {
  const {
    projects,
    loading,
    error,
    allTags,
    gitInfo,
    readmes,
    saveProject,
    deleteProjectRecord,
    archiveProject,
    projectFromPath,
    loadReadme,
    refreshGitInfo,
    openProject,
    runScript,
  } = useProjects();
  const { enabled: autostartEnabled, loading: autostartLoading, setAutostart } = useAutostart();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [dropMessage, setDropMessage] = useState('');

  useEffect(() => {
    if (!selectedId && projects.length) setSelectedId(projects[0].id);
    if (selectedId && !projects.some((project) => project.id === selectedId)) {
      setSelectedId(projects[0]?.id ?? '');
    }
  }, [projects, selectedId]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesTag = tagFilter === 'all' || project.tags?.includes(tagFilter);
      const haystack = [project.name, project.description, project.path, ...(project.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return matchesStatus && matchesTag && (!query || haystack.includes(query));
    });
  }, [projects, search, statusFilter, tagFilter]);

  const selectedProject = projects.find((project) => project.id === selectedId) ?? null;

  const openAddModal = () => {
    setEditingProject(emptyProject());
    setModalOpen(true);
  };

  const editSelected = () => {
    setEditingProject(selectedProject);
    setModalOpen(true);
  };

  useEffect(() => {
    let unlisten = null;

    try {
      getCurrentWebview()
        .onDragDropEvent(async (event) => {
          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            setDropActive(true);
            setDropMessage('松开鼠标即可添加文件夹');
            return;
          }

          if (event.payload.type === 'leave') {
            setDropActive(false);
            setDropMessage('');
            return;
          }

          if (event.payload.type === 'drop') {
            setDropActive(false);
            await addDroppedPaths(event.payload.paths ?? []);
          }
        })
        .then((cleanup) => {
          unlisten = cleanup;
        })
        .catch((err) => {
          console.warn('Drag and drop listener failed:', err);
        });
    } catch (err) {
      console.warn('Drag and drop is only available inside Tauri:', err);
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, [projects]);

  const chooseProjectDirectory = async () => {
    const selected = await openDialog({ directory: true, multiple: false, title: '选择项目文件夹' });
    if (typeof selected !== 'string') return;
    await addProjectPath(selected);
  };

  const addDroppedPaths = async (paths) => {
    if (!paths.length) return;
    for (const path of paths) {
      await addProjectPath(path);
    }
  };

  const addProjectPath = async (path) => {
    try {
      const candidate = await projectFromPath(path);
      const existing = projects.find((project) => project.path === candidate.path);
      if (existing) {
        setSelectedId(existing.id);
        setDropMessage(`已存在：${existing.name}`);
        window.setTimeout(() => setDropMessage(''), 1800);
        return;
      }
      const saved = await saveProject(candidate);
      setSelectedId(saved.id);
      setDropMessage(`已添加：${saved.name}`);
      window.setTimeout(() => setDropMessage(''), 1800);
    } catch (err) {
      window.alert(String(err));
    }
  };

  const handleOpenProject = async (target, project) => {
    try {
      await openProject(target, project);
    } catch (err) {
      window.alert(String(err));
    }
  };

  const removeSelected = async () => {
    if (!selectedProject) return;
    try {
      await deleteProjectRecord(selectedProject.id);
    } catch (err) {
      window.alert(String(err));
    }
  };

  const archiveSelected = async () => {
    if (!selectedProject) return;
    try {
      await archiveProject(selectedProject.id);
    } catch (err) {
      window.alert(String(err));
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects}
        allTags={allTags}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        onAddProject={openAddModal}
        onChooseFolder={chooseProjectDirectory}
        autostartEnabled={autostartEnabled}
        autostartLoading={autostartLoading}
        onAutostartChange={setAutostart}
      />

      <ProjectList
        projects={filteredProjects}
        selectedId={selectedId}
        loading={loading}
        onSelect={setSelectedId}
      />

      <ProjectDetail
        project={selectedProject}
        readme={selectedProject ? readmes[selectedProject.id] : null}
        gitInfo={selectedProject ? gitInfo[selectedProject.id] : null}
        onLoadReadme={loadReadme}
        onRefreshGit={refreshGitInfo}
        onOpen={handleOpenProject}
        onEdit={editSelected}
        onArchive={archiveSelected}
        onRemove={removeSelected}
        onRunScript={runScript}
      />

      {error && <div className="floating-error">{error}</div>}
      {dropMessage && !dropActive && <div className="floating-toast">{dropMessage}</div>}

      {dropActive && (
        <div className="drop-overlay">
          <div>
            <FolderPlus size={34} />
            <strong>添加到 DevDash</strong>
            <span>只保存项目路径和基础信息，不识别标签、不生成脚本、不修改项目目录。</span>
          </div>
        </div>
      )}

      <ProjectFormModal
        open={modalOpen}
        project={editingProject}
        onClose={() => setModalOpen(false)}
        onSave={async (project) => {
          const saved = await saveProject(project);
          setSelectedId(saved.id);
        }}
      />
    </div>
  );
}
