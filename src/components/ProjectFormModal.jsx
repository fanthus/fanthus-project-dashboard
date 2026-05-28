import { open } from '@tauri-apps/plugin-dialog';
import { Folder, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { STATUS_OPTIONS, emptyProject } from '../utils/status';

export default function ProjectFormModal({ open: visible, project, onClose, onSave }) {
  const [draft, setDraft] = useState(emptyProject());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(emptyProject(project ?? {}));
      setError('');
    }
  }, [visible, project]);

  if (!visible) return null;

  const updateField = (field, value) => setDraft((item) => ({ ...item, [field]: value }));
  const updateScript = (index, field, value) => {
    setDraft((item) => ({
      ...item,
      scripts: item.scripts.map((script, scriptIndex) =>
        scriptIndex === index ? { ...script, [field]: value } : script,
      ),
    }));
  };

  const choosePath = async () => {
    const selected = await open({ directory: true, multiple: false, title: '选择项目目录' });
    if (typeof selected === 'string') updateField('path', selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...draft,
        tags: String(draft.tagsText ?? draft.tags?.join(', ') ?? '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const tagsText = draft.tagsText ?? (draft.tags ?? []).join(', ');

  return (
    <div className="modal-backdrop">
      <form className="project-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p>{draft.id ? 'Edit Project' : 'New Project'}</p>
            <h2>{draft.id ? '编辑项目信息' : '添加本地项目'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          <label>
            项目名称
            <input value={draft.name} onChange={(event) => updateField('name', event.target.value)} required />
          </label>
          <label>
            状态
            <select value={draft.status} onChange={(event) => updateField('status', event.target.value)}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          项目路径
          <div className="path-picker">
            <input value={draft.path} onChange={(event) => updateField('path', event.target.value)} required />
            <button type="button" className="ghost-button compact" onClick={choosePath}>
              <Folder size={15} />
              选择
            </button>
          </div>
        </label>

        <label>
          描述
          <textarea value={draft.description} onChange={(event) => updateField('description', event.target.value)} />
        </label>

        <label>
          标签
          <input
            value={tagsText}
            placeholder="macOS, Tauri, React"
            onChange={(event) => updateField('tagsText', event.target.value)}
          />
        </label>

        <label>
          当前进度
          <textarea value={draft.progress} onChange={(event) => updateField('progress', event.target.value)} />
        </label>

        <label>
          下一步计划
          <textarea value={draft.nextSteps} onChange={(event) => updateField('nextSteps', event.target.value)} />
        </label>

        <div className="script-editor">
          <div className="section-heading">
            <h3>自定义脚本</h3>
            <button
              type="button"
              className="icon-text-button"
              onClick={() => updateField('scripts', [...(draft.scripts ?? []), { name: '', command: '' }])}
            >
              <Plus size={15} />
              添加脚本
            </button>
          </div>
          {(draft.scripts ?? []).map((script, index) => (
            <div className="script-editor-row" key={index}>
              <input
                value={script.name}
                placeholder="Dev"
                onChange={(event) => updateScript(index, 'name', event.target.value)}
              />
              <input
                value={script.command}
                placeholder="npm run dev"
                onChange={(event) => updateScript(index, 'command', event.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => updateField('scripts', draft.scripts.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>取消</button>
          <button className="primary-button" disabled={saving}>{saving ? '保存中...' : '保存项目'}</button>
        </div>
      </form>
    </div>
  );
}
