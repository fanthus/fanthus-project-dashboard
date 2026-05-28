import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

export default function ReadmeViewer({ content, loading, onOpenCursor }) {
  if (loading) {
    return <div className="readme-shell empty-state">正在读取 README...</div>;
  }

  if (!content) {
    return (
      <div className="readme-shell readme-empty">
        <FileText size={28} />
        <strong>没有找到 README</strong>
        <span>支持 README.md、readme.md 和 README。</span>
        <button className="ghost-button compact" onClick={onOpenCursor}>在 Cursor 中打开项目</button>
      </div>
    );
  }

  return (
    <div className="readme-shell markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
