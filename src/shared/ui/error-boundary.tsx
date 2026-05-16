import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center space-y-6 text-center p-8 bg-surface-default rounded-[40px] border border-border/50">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading uppercase tracking-tighter italic">Oops! Có lỗi xảy ra</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm font-medium">
              Hệ thống gặp sự cố bất ngờ. Vui lòng làm mới trang hoặc thử lại sau.
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            variant="default"
            size="lg"
            className="rounded-2xl font-black uppercase text-[10px] tracking-widest h-12"
          >
            <RefreshCcw className="h-4 w-4" /> Làm mới trang
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-muted/50 rounded-xl text-left text-[10px] max-w-full overflow-auto border border-border/50 text-destructive font-mono">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
