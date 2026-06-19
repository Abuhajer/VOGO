"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-void px-6 text-center">
          <p className="text-gold text-4xl mb-4" aria-hidden>
            ⚜
          </p>
          <h1 className="text-xl font-serif text-ivory mb-2">Something went wrong</h1>
          <p className="text-sm text-ivory-muted mb-6 max-w-md">
            Please refresh the page or return to the homepage.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/ar";
            }}
            className="px-6 py-3 bg-gold text-[#0E0D12] text-xs font-semibold uppercase tracking-wider rounded-sm"
          >
            Return Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
