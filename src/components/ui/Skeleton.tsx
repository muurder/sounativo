import React from 'react';
import { cn } from '@/utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-xl bg-stone-200/80', className)} aria-hidden="true" />
);

export const TripCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
    <Skeleton className="h-56 w-full rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-1/2" />
      <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);
