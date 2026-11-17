import React from 'react';
import { cn } from '@/utils/cn';

type BadgeTone = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning';

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  secondary: 'bg-secondary-50 text-secondary-800 border-secondary-200',
  neutral: 'bg-stone-100 text-stone-700 border-stone-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-900 border-amber-200',
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
      TONE_CLASSES[tone],
      className
    )}
  >
    {children}
  </span>
);
