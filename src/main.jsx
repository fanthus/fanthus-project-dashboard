import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('ProjectDashboard render failed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="startup-error">
          <strong>ProjectDashboard 前端渲染失败</strong>
          <span>{String(this.state.error?.message ?? this.state.error)}</span>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (error) {
  console.error('ProjectDashboard boot failed:', error);
  document.getElementById('root').innerHTML = `
    <div class="startup-error">
      <strong>ProjectDashboard 启动失败</strong>
      <span>${String(error?.message ?? error)}</span>
    </div>
  `;
}
