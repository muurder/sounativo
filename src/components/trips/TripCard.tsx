import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Heart, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import { Trip } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/utils/cn';

interface TripCardProps {
  trip: Trip;
  isFavorite?: boolean;
  onToggleFavorite?: (tripId: string) => void;
  basePath?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  isFavorite = false,
  onToggleFavorite,
  basePath = '/viagem',
}) => {
  const detailPath = `${basePath}/${trip.slug || trip.id}`;
  const coverImage =
    trip.images[0] ||
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition-all duration-200 hover:border-primary-300 hover:shadow-editorial">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <Link
          to={detailPath}
          className="block h-full w-full"
          aria-label={`Ver detalhes de ${trip.title}`}
        >
          <img
            src={coverImage}
            alt={trip.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
        </Link>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <Badge
            tone="neutral"
            className="bg-white/95 text-stone-900 border-white/50 backdrop-blur-sm"
          >
            {CATEGORY_LABELS[trip.category]}
          </Badge>
        </div>

        {onToggleFavorite && (
          <Tooltip content={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}>
            <button
              type="button"
              onClick={() => onToggleFavorite(trip.id)}
              aria-label={
                isFavorite ? `Remover ${trip.title} dos favoritos` : `Favoritar ${trip.title}`
              }
              aria-pressed={isFavorite}
              className="absolute top-3 right-3 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm backdrop-blur-sm hover:scale-105 transition-transform"
            >
              <Heart
                size={18}
                className={cn(
                  isFavorite ? 'fill-secondary-500 text-secondary-500' : 'text-stone-700'
                )}
              />
            </button>
          </Tooltip>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/55 px-2.5 py-1 backdrop-blur-sm">
            <MapPin size={13} className="text-secondary-300" />
            {trip.destination}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/55 px-2.5 py-1 backdrop-blur-sm">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {trip.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 mb-1.5">
          <ShieldCheck size={14} aria-hidden="true" />
          <span className="truncate">{trip.agencyName}</span>
        </div>

        <Link to={detailPath} className="group/title">
          <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-2 group-hover/title:text-primary-600 transition-colors">
            {trip.title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-4 text-xs text-stone-600 pb-4 border-b border-stone-100">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} className="text-stone-400" />
            {trip.durationDays} dias
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-stone-400" />
            Até {trip.maxGuests} viajantes
          </span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
              A partir de
            </p>
            <p className="text-xl font-extrabold text-primary-600 tabular-nums">
              {formatCurrencyBRL(trip.price)}
              <span className="text-xs font-normal text-stone-500"> / pessoa</span>
            </p>
          </div>

          <Link
            to={detailPath}
            aria-label={`Explorar ${trip.title}`}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm"
          >
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
};
