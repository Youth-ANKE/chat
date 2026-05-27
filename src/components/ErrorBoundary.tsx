import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[#030312]">
          <div className="relative z-10 text-center max-w-md px-6 animate-scale-in">
            {/* Icon */}
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 rounded-full bg-red-400/20 blur-2xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white/90 mb-2">出现了一些问题</h2>
            <p className="text-sm text-white/50 mb-1 leading-relaxed">
              应用遇到了未预期的错误，请尝试刷新页面。
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400/60 mb-6 font-mono bg-black/20 rounded-lg px-3 py-2 max-h-24 overflow-auto">
                {this.state.error.message}
              </p>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all duration-200 shadow-[0_0_16px_rgba(0,229,255,0.1)] hover:shadow-[0_0_24px_rgba(0,229,255,0.15)] text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
