import * as React from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Home, ShieldAlert } from 'lucide-react';
import { logError } from '@/lib/errorLogger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, copied: false });
    window.location.reload();
  };

  private handleCopyStack = () => {
    if (!this.state.error) return;
    const stackText = `${this.state.error.name}: ${this.state.error.message}\n\nStack:\n${this.state.error.stack}`;
    navigator.clipboard.writeText(stackText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, copied: false });
    // Remove session flags or local storage states that might cause crash loop
    window.localStorage.removeItem('gg_billing_prefill_v1');
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary/30 font-sans relative overflow-hidden dark">
          {/* Futuristic Glowing Ambient Accents */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-destructive/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

          <div className="w-full max-w-2xl bg-card/40 border border-destructive/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
            
            {/* Header Icon & Brand */}
            <div className="flex items-center gap-4 border-b border-border/40 pb-5">
              <div className="rounded-xl p-3 bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center animate-pulse">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  System Exception Detected
                </h1>
                <p className="text-xs text-muted-foreground">
                  CoreControl Dashboard crashed but recovered successfully.
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> Diagnostics Message
              </span>
              <div className="bg-muted/40 border border-border/50 rounded-xl p-4 font-mono text-sm text-foreground leading-relaxed break-words">
                {this.state.error?.name || 'UnknownError'}: {this.state.error?.message || 'A critical rendering loop occurred.'}
              </div>
            </div>

            {/* Expandable Stack Trace */}
            {this.state.error?.stack && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Diagnostics Log
                  </span>
                  <button
                    onClick={this.handleCopyStack}
                    className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors bg-muted/60 border border-border/50 px-2.5 py-1 rounded-md"
                  >
                    {this.state.copied ? (
                      <>
                        <Check size={12} className="text-green-500" /> Copied Stack
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy Stack
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-muted/30 border border-border/40 rounded-xl p-4 font-mono text-xs text-muted-foreground/80 max-h-[160px] overflow-y-auto leading-relaxed scrollbar-thin select-all">
                  {this.state.error.stack}
                </div>
              </div>
            )}

            {/* Informational Alerts */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              If this error persists, local data corruption or an invalid cached session could be the cause. Try resetting your application cache below or emailing support.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground text-sm font-bold shadow-md shadow-destructive/10 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <RefreshCw size={16} /> Reload Application
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-muted/40 hover:bg-muted/60 text-foreground border border-border/50 text-sm font-bold transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Home size={16} /> Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
