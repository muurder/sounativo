import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Erro inesperado ao carregar esta página.' };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-accent-50 p-6">
          <div className="max-w-md w-full rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-50 text-secondary-700">
              <AlertTriangle size={24} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Algo saiu da rota</h1>
            <p className="mt-2 text-sm text-stone-600">{this.state.message}</p>
            <div className="mt-6">
              <Button
                variant="primary"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => window.location.reload()}
              >
                Recarregar aplicação
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
