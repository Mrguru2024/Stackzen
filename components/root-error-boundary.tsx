'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui';
import { logError } from '@/lib/error';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error only once
    if (!this.state.hasError) {
      logError({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        componentStack: errorInfo.componentStack ?? undefined,
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-foreground">Application Error</h1>
            <p className="mb-4 text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="flex flex-col gap-4">
              <Button onClick={this.handleReset} className="w-full">
                Return to Home
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
