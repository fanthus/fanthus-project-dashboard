import { Play, TerminalSquare } from 'lucide-react';

export default function ScriptPanel({ project, runningScript, results, onRunScript }) {
  const scripts = project?.scripts ?? [];

  return (
    <section className="detail-section">
      <div className="section-heading">
        <h3>自定义脚本</h3>
        <span className="risk-note">仅运行你自己配置并信任的命令</span>
      </div>

      {!scripts.length && <div className="empty-state small">还没有配置脚本，可在编辑项目中添加。</div>}

      <div className="script-list">
        {scripts.map((script, index) => {
          const key = `${project.id}-${index}`;
          const result = results[key];
          const running = runningScript === key;
          return (
            <div className="script-item" key={key}>
              <div>
                <strong>{script.name}</strong>
                <code>{script.command}</code>
              </div>
              <button className="icon-button run" onClick={() => onRunScript(script, index)} disabled={running}>
                {running ? <TerminalSquare size={16} /> : <Play size={16} />}
              </button>
              {result && (
                <pre className={result.success ? 'script-output success' : 'script-output failed'}>
                  {[
                    `exit ${result.code ?? 'unknown'}`,
                    result.stdout?.trim(),
                    result.stderr?.trim(),
                  ]
                    .filter(Boolean)
                    .join('\n\n')}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
