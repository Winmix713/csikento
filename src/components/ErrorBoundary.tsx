import React from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-surface rounded-2xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Your presets and saved data are safe.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[11px] font-mono text-destructive/80 bg-destructive/5 rounded-xl p-3 text-left overflow-auto max-h-32 border border-destructive/10">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
