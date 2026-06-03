import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
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
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Элементті жүктеуде қате шықты</h3>
            <p className="text-sm px-2" style={{ color: 'var(--muted-foreground)' }}>
              {this.props.fallbackMessage || 'Кодта немесе формулаларды өңдеуде кішігірім қателік орын алды.'}
            </p>
            {this.state.error?.message && (
              <p className="text-xs mt-2 opacity-70 break-all" style={{ color: 'var(--muted-foreground)' }}>
                Қате: {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-1.5 rounded-lg text-sm flex items-center gap-2"
            style={{ background: 'var(--input-background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            <RefreshCw size={14} /> Қайта жүктеу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
