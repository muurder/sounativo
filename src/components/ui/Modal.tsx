import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200',
          'max-h-[92vh] overflow-y-auto animate-scale-in',
          maxWidthClass
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 py-4">
          <div>
            <h2 id={titleId} className="font-serif text-xl font-bold text-stone-900">
              {title}
            </h2>
            {description && <p className="text-sm text-stone-600 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 inline-flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
