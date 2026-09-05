import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LifeThread encountered an unexpected error.', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3ed] px-5">
        <section className="max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#27231f]">LifeThread needs a refresh</h1>
          <p className="mt-2 text-sm text-[#766e64]">The app hit an unexpected error. Your saved journal data was not deleted.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-[#4f46a5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#40388f]"
          >
            Refresh app
          </button>
        </section>
      </main>
    );
  }
}
