import React from 'react';
import { Compass } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
      {icon ?? <Compass size={28} />}
    </div>
    <h3 className="font-serif text-xl font-bold text-stone-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-6">
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);
