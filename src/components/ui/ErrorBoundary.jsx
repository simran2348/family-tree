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
    console.error('Application error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full flex items-center justify-center bg-app p-6">
        <div className="panel max-w-md p-6 text-center">
          <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted mt-2">Your data is saved locally and has not been lost. Reloading usually fixes this.</p>
          <pre className="text-[0.72rem] text-left bg-surface-alt rounded p-2 mt-4 overflow-auto max-h-32">{String(this.state.error?.message || this.state.error)}</pre>
          <div className="flex gap-2 justify-center mt-4">
            <button type="button" className="btn btn-outline" onClick={() => this.setState({ error: null })}>Try again</button>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      </div>
    );
  }
}
