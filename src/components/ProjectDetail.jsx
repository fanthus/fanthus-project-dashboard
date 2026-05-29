import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Code2,
  Edit3,
  ExternalLink,
  FolderOpen,
  GitBranch,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate, statusLabel } from '../utils/status';
import GitPanel from './GitPanel';
import ReadmeViewer from './ReadmeViewer';
import ScriptPanel from './ScriptPanel';

export default function ProjectDetail({
  project,
  readme,
  gitInfo,
  onLoadReadme,
  onRefreshGit,
  onOpen,
  onEdit,
  onArchive,
  onRemove,
  onRunScript,
}) {
  const [tab, setTab] = useState('overview');
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [gitLoading, setGitLoading] = useState(false);
  const [runningScript, setRunningScript] = useState('');
  const [scriptResults, setScriptResults] = useState({});

  useEffect(() => {
    if (!project) return;
    setTab('overview');
    setReadmeLoading(true);
    setGitLoading(true);
    onLoadReadme(project).catch(() => null).finally(() => setReadmeLoading(false));
    onRefreshGit(project).catch(() => null).finally(() => setGitLoading(false));
  }, [project?.id]);

  if (!project) {
    return (
      <aside className="detail-panel empty-detail">
        <div className="empty-state">
          <strong>选择一个项目</strong>
          <span>右侧会展示 README、Git、进度、脚本和打开入口。</span>
        </div>
      </aside>
    );
  }

  const runScript = async (script, index) => {
    const key = `${project.id}-${index}`;
    setRunningScript(key);
    try {
      const result = await onRunScript(project, script);
      setScriptResults((items) => ({ ...items, [key]: result }));
    } catch (err) {
      setScriptResults((items) => ({
        ...items,
        [key]: { success: false, code: null, stdout: '', stderr: String(err) },
      }));
    } finally {
      setRunningScript('');
    }
  };

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <span className={`status-badge ${project.status}`}>{statusLabel(project.status)}</span>
          <h2>{project.name}</h2>
          <p>{project.description || '暂无描述'}</p>
        </div>
        <button className="icon-button" onClick={onEdit} title="编辑项目">
          <Edit3 size={17} />
        </button>
      </div>

      <div className="detail-actions">
        <button onClick={() => onOpen('finder', project)}><FolderOpen size={16} />Finder</button>
        <button onClick={() => onOpen('cursor', project)}><Code2 size={16} />Cursor</button>
        <button onClick={() => onOpen('xcode', project)}><ExternalLink size={16} />Xcode</button>
        <button onClick={() => onOpen('terminal', project)}><Terminal size={16} />Terminal</button>
      </div>

      <div className="tab-bar">
        {['overview', 'readme', 'git', 'scripts'].map((item) => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
            {item === 'overview' ? '概览' : item === 'readme' ? 'README' : item === 'git' ? 'Git' : '脚本'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="detail-scroll">
          <section className="detail-section">
            <h3>基础信息</h3>
            <div className="info-grid">
              <span>路径</span>
              <code>{project.path}</code>
              <span>更新</span>
              <strong>{formatDate(project.updatedAt)}</strong>
              <span>创建</span>
              <strong>{formatDate(project.createdAt)}</strong>
            </div>
            <div className="tag-row roomy">
              {(project.tags ?? []).length ? (
                (project.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)
              ) : (
                <span className="muted-hint">暂无标签</span>
              )}
            </div>
            <div className="overview-git">
              <span>
                <GitBranch size={14} />
                {gitInfo?.branch || (gitInfo?.isGit === false ? '非 Git 仓库' : 'Git 待刷新')}
              </span>
              {gitInfo && gitInfo.isGit !== false && (
                <span className={gitInfo?.hasChanges ? 'dirty' : 'clean'}>
                  {gitInfo?.hasChanges ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  {gitInfo?.hasChanges ? '有未提交变更' : '工作区干净'}
                </span>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3>进度</h3>
            <p className="long-copy">{project.progress || '暂无进度记录'}</p>
          </section>

          <section className="detail-section">
            <h3>下一步计划</h3>
            <p className="long-copy">{project.nextSteps || '暂无下一步计划'}</p>
          </section>

          <section className="danger-zone">
            <button onClick={onArchive}><Archive size={16} />归档项目</button>
            <button onClick={onRemove}><X size={16} />从 DevDash 移除</button>
            <button
              onClick={() => window.confirm('当前版本不会直接删除本地文件，请手动在 Finder 中删除。')}
            >
              <Trash2 size={16} />
              删除本地项目
            </button>
          </section>
        </div>
      )}

      {tab === 'readme' && (
        <ReadmeViewer content={readme} loading={readmeLoading} onOpenCursor={() => onOpen('cursor', project)} />
      )}

      {tab === 'git' && (
        <GitPanel
          info={gitInfo}
          loading={gitLoading}
          onRefresh={() => {
            setGitLoading(true);
            onRefreshGit(project).finally(() => setGitLoading(false));
          }}
        />
      )}

      {tab === 'scripts' && (
        <ScriptPanel
          project={project}
          runningScript={runningScript}
          results={scriptResults}
          onRunScript={runScript}
        />
      )}
    </aside>
  );
}
