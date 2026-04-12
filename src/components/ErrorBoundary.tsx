import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-950 text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <div className="bg-red-900 p-4 rounded mb-4">
            <h2 className="font-bold mb-2">Error:</h2>
            <pre className="text-sm overflow-auto">{this.state.error?.toString()}</pre>
          </div>
          {this.state.errorInfo && (
            <div className="bg-red-900 p-4 rounded">
              <h2 className="font-bold mb-2">Component Stack:</h2>
              <pre className="text-sm overflow-auto">{this.state.errorInfo.componentStack}</pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-700 px-4 py-2 rounded hover:bg-red-600"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
