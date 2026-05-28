import { GitBranch, RotateCw } from 'lucide-react';

export default function GitPanel({ info, loading, onRefresh }) {
  return (
    <section className="detail-section">
      <div className="section-heading">
        <h3>Git 状态</h3>
        <button className="icon-text-button" onClick={onRefresh} disabled={loading}>
          <RotateCw size={15} />
          刷新
        </button>
      </div>

      {loading && <div className="empty-state small">正在读取 Git 信息...</div>}
      {!loading && !info && <div className="empty-state small">选择项目后自动读取 Git 信息。</div>}
      {!loading && info?.isGit === false && <div className="empty-state small">{info.error}</div>}

      {!loading && info?.isGit && (
        <>
          <div className="git-summary">
            <span>
              <GitBranch size={15} />
              {info.branch || 'detached HEAD'}
            </span>
            <strong className={info.hasChanges ? 'dirty' : 'clean'}>
              {info.hasChanges ? '有未提交变更' : '工作区干净'}
            </strong>
          </div>

          <div className="split-grid">
            <div>
              <h4>工作区</h4>
              <pre>{info.status?.length ? info.status.join('\n') : 'No changes'}</pre>
            </div>
            <div>
              <h4>最近提交</h4>
              <pre>{info.commits?.length ? info.commits.join('\n') : 'No commits'}</pre>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
