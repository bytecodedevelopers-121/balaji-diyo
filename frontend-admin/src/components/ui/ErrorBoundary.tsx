import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/constants/PATHS";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Top-level safety net: without this, any render-time error in a page/component
// (a null deref on unexpected API data, a bad prop, etc.) unmounts the whole React
// tree and leaves the admin with a blank white screen and no way back except a
// manual URL edit. React error boundaries must be class components — there is no
// hooks equivalent — so this is deliberately the one class component in the app.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Last-resort diagnostic — no error-reporting service is wired up yet.
    console.error("Unhandled render error caught by ErrorBoundary:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = PATHS.DASHBOARD;
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
          <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
          <p className="max-w-sm text-sm text-on-surface-variant">
            An unexpected error occurred while rendering this page. You can try going back to the dashboard — if it keeps
            happening, let the team know what you were doing.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-gray-900 p-3 text-left text-xs text-red-300">
              {this.state.error.message}
            </pre>
          )}
          <Button className="mt-2" onClick={this.handleReset}>
            Back to dashboard
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
