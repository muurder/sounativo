import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 md:bottom-6 right-4 z-[90] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
          const toneClass =
            toast.type === 'success'
              ? 'border-primary-600/20 bg-white text-stone-900'
              : toast.type === 'error'
                ? 'border-red-500/30 bg-white text-red-900'
                : 'border-stone-200 bg-white text-stone-900';

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-editorial animate-scale-in ${toneClass}`}
            >
              <Icon
                size={18}
                className={
                  toast.type === 'success'
                    ? 'text-primary-500 mt-0.5 shrink-0'
                    : toast.type === 'error'
                      ? 'text-red-600 mt-0.5 shrink-0'
                      : 'text-secondary-600 mt-0.5 shrink-0'
                }
              />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar notificação"
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
