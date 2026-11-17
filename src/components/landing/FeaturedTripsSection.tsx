import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Trip } from '@/types';
import { TripCard } from '@/components/trips/TripCard';
import { TripCardSkeleton } from '@/components/ui/Skeleton';

interface FeaturedTripsSectionProps {
  trips: Trip[];
  loading: boolean;
  favorites: string[];
  onToggleFavorite: (tripId: string) => void;
}

export const FeaturedTripsSection: React.FC<FeaturedTripsSectionProps> = ({
  trips,
  loading,
  favorites,
  onToggleFavorite,
}) => {
  const featured = trips.filter((t) => t.featured).slice(0, 3);
  const displayTrips = featured.length > 0 ? featured : trips.slice(0, 3);

  return (
    <section className="bg-white border-b border-stone-200/70 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Experiências em destaque
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-[58ch]">
              Roteiros curados para quem busca paisagens preservadas e hospedagem escolhida a dedo.
            </p>
          </div>
          <Link
            to="/trips"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 shrink-0"
          >
            Ver catálogo completo <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <TripCardSkeleton key={n} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isFavorite={favorites.includes(trip.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
