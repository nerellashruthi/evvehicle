import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console for developer diagnostics
    console.error('ChargeNix ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-ink-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
          {/* Subtle neon background accents */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-acid/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-danger-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full glass rounded-3xl p-6 sm:p-8 border border-white/10 text-center shadow-2xl backdrop-blur-xl">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>

            {/* Error Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-danger-500/15 border border-danger-500/30 flex items-center justify-center text-danger-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Heading */}
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-ink-300 mb-6 leading-relaxed">
              ChargeNix encountered an unexpected error while rendering this page. You can try refreshing or returning to the home screen.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-primary inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn-secondary inline-flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-ink-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                Try Again
              </button>
            </div>

            {/* Expandable Technical Details */}
            {this.state.error && (
              <div className="mt-4 pt-4 border-t border-white/5 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="w-full flex items-center justify-between text-xs font-semibold text-ink-400 hover:text-ink-200 transition-colors"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3.5 rounded-xl bg-ink-900/90 border border-white/10 font-mono text-xs text-danger-300 overflow-x-auto max-h-48 scrollbar-thin">
                    <div className="font-bold text-ink-200 mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="text-[10px] text-ink-400 whitespace-pre-wrap mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
