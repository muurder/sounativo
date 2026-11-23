import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Share2, ShieldCheck, Star } from 'lucide-react';
import { Trip } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface TripHeaderProps {
  trip: Trip;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare?: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  isFavorite,
  onToggleFavorite,
  onShare,
}) => {
  const categoryLabel = CATEGORY_LABELS[trip.category] ?? 'Experiência';
  const numericRating =
    typeof trip.rating === 'number' && Number.isFinite(trip.rating) ? trip.rating : 0;
  const reviewCount = trip.totalReviews ?? 0;
  const hasReviews = numericRating > 0 || reviewCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="secondary">{categoryLabel}</Badge>
          <Badge tone="primary">
            <Star size={12} className="fill-current" />{' '}
            {hasReviews ? `${numericRating.toFixed(1)} (${reviewCount})` : 'Novo no catálogo'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              aria-label={`Compartilhar ${trip.title}`}
              className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:border-primary-300"
            >
              <Share2 size={15} className="text-stone-500" />
              Compartilhar
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:border-secondary-300"
          >
            <Heart
              size={16}
              className={cn(
                isFavorite ? 'fill-secondary-500 text-secondary-500' : 'text-stone-500'
              )}
            />
            {isFavorite ? 'Salvo nos favoritos' : 'Salvar roteiro'}
          </button>
        </div>
      </div>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
        {trip.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <MapPin size={16} className="text-secondary-600" />
          {trip.destination || 'Brasil'}
        </span>
        {trip.agencySlug ? (
          <Link
            to={`/${trip.agencySlug}`}
            className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:underline"
          >
            <ShieldCheck size={16} />
            Operado por {trip.agencyName || 'Agência Parceira'}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
            <ShieldCheck size={16} />
            Operado por {trip.agencyName || 'Agência Parceira'}
          </span>
        )}
      </div>

      <p className="text-base text-stone-700 leading-relaxed pt-2">{trip.description}</p>
    </div>
  );
};
