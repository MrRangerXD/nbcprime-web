import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Something broke</h1>
          <p className="mt-2 text-sm text-muted">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <p className="mt-4 break-all font-mono text-xs text-white/40">{String(this.state.error?.message || this.state.error)}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
            <a href="/" className="btn-ghost">Go home</a>
          </div>
        </div>
      </div>
    );
  }
}
