"use client";

import { Component, type ReactNode } from "react";
import posthog from "posthog-js";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error boundary errors are always logged as they indicate React tree failures
    if (process.env.NEXT_PUBLIC_APP_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    posthog.capture("$exception", {
      $exception_message: error.message,
      $exception_type: error.name,
      $exception_stack_trace_raw: error.stack,
      $exception_component_stack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="bg-white border border-[#c4c4c4] rounded p-8 max-w-md shadow-sm">
            <h2 className="text-xl font-semibold text-[#060823] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[#52525b] mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#161F81] hover:bg-[#1a2599] rounded cursor-pointer transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
