import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) { console.error('[boundary]', error, info); }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-bold">Something broke</h1>
          <p className="mt-2 text-sm text-muted">{String(this.state.error?.message || this.state.error)}</p>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
