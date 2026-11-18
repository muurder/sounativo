import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const rawMsg = error?.message || '';
    const isChunkLoadFailure =
      /Failed to fetch dynamically imported module|Importing a module script failed/i.test(rawMsg);

    return {
      hasError: true,
      message: isChunkLoadFailure
        ? 'Uma nova versão da página foi publicada. Recarregue para continuar.'
        : rawMsg || 'Erro inesperado ao carregar esta página.',
    };
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: '' });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-accent-50 p-6">
          <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-700">
              <AlertTriangle size={24} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Algo saiu da rota</h1>
            <p className="mt-2 text-sm text-stone-600">{this.state.message}</p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Recarregar página
              </Button>
              <Button
                variant="outline"
                leftIcon={<Home size={16} />}
                onClick={() => {
                  this.handleReset();
                  window.location.assign('/');
                }}
              >
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
