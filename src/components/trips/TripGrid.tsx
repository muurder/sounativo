import React from 'react';
import { Trip } from '@/types';
import { TripCard } from './TripCard';
import { TripCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface TripGridProps {
  trips: Trip[];
  loading: boolean;
  favorites?: string[];
  onToggleFavorite?: (tripId: string) => void;
  onResetFilters?: () => void;
  basePath?: string;
}

export const TripGrid: React.FC<TripGridProps> = ({
  trips,
  loading,
  favorites = [],
  onToggleFavorite,
  onResetFilters,
  basePath,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <TripCardSkeleton key={n} />
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        title="Nenhuma experiência encontrada"
        description="Ajuste o destino ou a categoria selecionada para descobrir outros roteiros verificados pelo Brasil."
        actionLabel={onResetFilters ? 'Limpar filtros' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          isFavorite={favorites.includes(trip.id)}
          onToggleFavorite={onToggleFavorite}
          basePath={basePath}
        />
      ))}
    </div>
  );
};
