import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { emptyProject } from '../utils/status';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gitInfo, setGitInfo] = useState({});
  const [readmes, setReadmes] = useState({});

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const store = await invoke('list_projects');
      setProjects(store.projects ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    if (!projects.length) return;

    let cancelled = false;

    Promise.all(
      projects.map(async (project) => {
        try {
          const info = await invoke('get_git_info', { projectPath: project.path });
          if (!cancelled) {
            setGitInfo((items) => ({ ...items, [project.id]: info }));
          }
        } catch {
          // ignore per-project git read failures
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const saveProject = useCallback(async (project) => {
    const normalized = emptyProject({
      ...project,
      tags: normalizeTags(project.tags),
      scripts: normalizeScripts(project.scripts),
    });
    const saved = await invoke('save_project', { project: normalized });
    setProjects((items) => {
      const existing = items.findIndex((item) => item.id === saved.id);
      if (existing === -1) return [saved, ...items];
      return items.map((item) => (item.id === saved.id ? saved : item));
    });
    return saved;
  }, []);

  const deleteProjectRecord = useCallback(async (projectId) => {
    await invoke('delete_project_record', { projectId });
    setProjects((items) => items.filter((item) => item.id !== projectId));
  }, []);

  const archiveProject = useCallback(async (projectId) => {
    const archived = await invoke('archive_project', { projectId });
    setProjects((items) => items.map((item) => (item.id === projectId ? archived : item)));
    return archived;
  }, []);

  const projectFromPath = useCallback((path) => invoke('project_from_path', { path }), []);

  const scanDirectory = useCallback((path) => invoke('scan_directory', { path }), []);

  const loadReadme = useCallback(async (project) => {
    if (!project?.path) return null;
    const content = await invoke('read_readme', { projectPath: project.path });
    setReadmes((items) => ({ ...items, [project.id]: content }));
    return content;
  }, []);

  const refreshGitInfo = useCallback(async (project) => {
    if (!project?.path) return null;
    const info = await invoke('get_git_info', { projectPath: project.path });
    setGitInfo((items) => ({ ...items, [project.id]: info }));
    return info;
  }, []);

  const openProject = useCallback((target, project) => {
    const commandMap = {
      finder: 'open_in_finder',
      cursor: 'open_in_cursor',
      xcode: 'open_in_xcode',
      terminal: 'open_in_terminal',
    };
    return invoke(commandMap[target], { projectPath: project.path });
  }, []);

  const runScript = useCallback((project, script) => {
    return invoke('run_script', {
      projectPath: project.path,
      command: script.command,
    });
  }, []);

  const allTags = useMemo(() => {
    const set = new Set();
    projects.forEach((project) => project.tags?.forEach((tag) => set.add(tag)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [projects]);

  return {
    projects,
    loading,
    error,
    allTags,
    gitInfo,
    readmes,
    refreshProjects,
    saveProject,
    deleteProjectRecord,
    archiveProject,
    projectFromPath,
    scanDirectory,
    loadReadme,
    refreshGitInfo,
    openProject,
    runScript,
  };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  return String(tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeScripts(scripts) {
  if (!Array.isArray(scripts)) return [];
  return scripts
    .map((script) => ({
      name: String(script.name ?? '').trim(),
      command: String(script.command ?? '').trim(),
    }))
    .filter((script) => script.name && script.command);
}
