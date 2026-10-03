import { Component, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="empty-state" role="alert">
          <h1>This workspace could not be displayed</h1>
          <p>
            Try another page or reload the app. Reloading clears unsaved editor changes; explicitly
            saved local drafts remain on this browser.
          </p>
          <button onClick={() => window.location.reload()}>Reload app</button>
          <a href="#/">Return home</a>
        </section>
      );
    return this.props.children;
  }
}
