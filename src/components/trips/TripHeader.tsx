import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, ShieldCheck, Star } from 'lucide-react';
import { Trip } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface TripHeaderProps {
  trip: Trip;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({ trip, isFavorite, onToggleFavorite }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="secondary">{CATEGORY_LABELS[trip.category]}</Badge>
        <Badge tone="primary">
          <Star size={12} className="fill-current" /> {trip.rating.toFixed(1)} ({trip.totalReviews})
        </Badge>
      </div>

      <button
        type="button"
        onClick={onToggleFavorite}
        className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:border-secondary-300"
      >
        <Heart
          size={16}
          className={cn(isFavorite ? 'fill-secondary-500 text-secondary-500' : 'text-stone-500')}
        />
        {isFavorite ? 'Salvo nos favoritos' : 'Salvar roteiro'}
      </button>
    </div>

    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
      {trip.title}
    </h1>

    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <MapPin size={16} className="text-secondary-600" />
        {trip.destination}
      </span>
      <Link
        to={`/${trip.agencySlug}`}
        className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:underline"
      >
        <ShieldCheck size={16} />
        Operado por {trip.agencyName}
      </Link>
    </div>

    <p className="text-base text-stone-700 leading-relaxed pt-2">{trip.description}</p>
  </div>
);
