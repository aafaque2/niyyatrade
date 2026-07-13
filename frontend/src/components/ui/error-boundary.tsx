"use client";

import { Component, type ReactNode } from "react";
import { ErrorState } from "./error-state";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error?.message ?? "An unexpected error occurred in this section."}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
