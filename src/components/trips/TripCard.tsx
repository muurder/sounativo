import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Heart, MapPin, ShieldCheck, Star, Users } from 'lucide-react';
import { Trip } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { formatCurrencyBRL, formatDateRange } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/utils/cn';

interface TripCardProps {
  trip: Trip;
  isFavorite?: boolean;
  onToggleFavorite?: (tripId: string) => void;
  basePath?: string;
}

const FALLBACK_TRIP_COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80';

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  isFavorite = false,
  onToggleFavorite,
  basePath = '/viagem',
}) => {
  if (!trip) return null;

  const detailPath = `${basePath}/${trip.slug || trip.id}`;
  const coverImage = trip.images?.[0] || FALLBACK_TRIP_COVER;
  const boardingCity = trip.boardingPoints?.[0]?.location;
  const maxGuests = trip.maxGuests ?? 16;
  const remainingSpots =
    typeof trip.availableSpots === 'number' && Number.isFinite(trip.availableSpots)
      ? Math.max(0, trip.availableSpots)
      : maxGuests;
  const extraDeparturesCount = Array.isArray(trip.departures) ? trip.departures.length : 0;
  const allDeparturesSoldOut =
    remainingSpots === 0 &&
    (!Array.isArray(trip.departures) ||
      trip.departures.every((d) => (d?.availableSpots ?? d?.maxGuests ?? 0) === 0));
  const smallGroup = maxGuests <= 12;
  const price = trip.price ?? 0;
  const numericRating =
    typeof trip.rating === 'number' && Number.isFinite(trip.rating) ? trip.rating : 0;
  const hasRating = numericRating > 0 || (trip.totalReviews ?? 0) > 0;
  const categoryLabel = CATEGORY_LABELS[trip.category] ?? 'Experiência';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-editorial">
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <Link
          to={detailPath}
          className="block h-full w-full"
          aria-label={`Ver detalhes de ${trip.title}`}
        >
          <SafeImage
            src={coverImage}
            alt={trip.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/65 via-stone-950/10 to-transparent" />
        </Link>

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <Badge
            tone="neutral"
            className="bg-white/95 text-stone-900 border-white/60 backdrop-blur-sm"
          >
            {categoryLabel}
          </Badge>
          {smallGroup && (
            <Badge
              tone="primary"
              className="bg-primary-700/90 text-white border-transparent backdrop-blur-sm"
            >
              Grupo reduzido
            </Badge>
          )}
          {allDeparturesSoldOut && (
            <Badge tone="warning" className="backdrop-blur-sm">
              Esgotado
            </Badge>
          )}
        </div>

        {onToggleFavorite && (
          <div className="absolute top-3 right-3 z-10">
            <Tooltip
              position="bottom"
              content={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <button
                type="button"
                onClick={() => onToggleFavorite(trip.id)}
                aria-label={
                  isFavorite ? `Remover ${trip.title} dos favoritos` : `Favoritar ${trip.title}`
                }
                aria-pressed={isFavorite}
                className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm backdrop-blur-sm hover:scale-105 transition-transform"
              >
                <Heart
                  size={18}
                  className={cn(
                    isFavorite ? 'fill-secondary-500 text-secondary-500' : 'text-stone-700'
                  )}
                />
              </button>
            </Tooltip>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-1 backdrop-blur-sm max-w-[70%] truncate">
            <MapPin size={13} className="text-secondary-300 shrink-0" />
            <span className="truncate">{trip.destination || 'Brasil'}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-950/60 px-2.5 py-1 backdrop-blur-sm">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {hasRating ? numericRating.toFixed(1) : 'Novo'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 mb-1.5">
          <ShieldCheck size={14} aria-hidden="true" />
          <span className="truncate">{trip.agencyName || 'Agência Verificada'}</span>
        </div>

        <Link to={detailPath} className="group/title">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug line-clamp-2 group-hover/title:text-primary-600 transition-colors">
            {trip.title}
          </h3>
        </Link>

        <div className="mt-3 space-y-1.5 text-xs text-stone-600 pb-4 border-b border-stone-100">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
              <CalendarDays size={14} className="text-primary-600" />
              {formatDateRange(trip.startDate, trip.endDate)}
            </span>
            {extraDeparturesCount > 0 && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                +{extraDeparturesCount} turma{extraDeparturesCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-stone-400">·</span>
            <span>{trip.durationDays ?? 1} dias</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-stone-500">
            <span className="truncate">
              {boardingCity ? `Saída: ${boardingCity}` : `Até ${maxGuests} vagas`}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0 font-medium text-stone-600">
              <Users size={13} className="text-stone-400" />
              {remainingSpots < maxGuests ? `${remainingSpots} livres` : `máx. ${maxGuests}`}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">
              Por pessoa · Pix ou cartão
            </p>
            <p className="text-2xl font-extrabold text-primary-700 tabular-nums leading-tight">
              {formatCurrencyBRL(price)}
            </p>
            <p className="text-[11px] text-stone-500">
              ou até 10x de {formatCurrencyBRL(Math.ceil(price / 10))}
            </p>
          </div>

          <Link
            to={detailPath}
            aria-label={`Explorar ${trip.title}`}
            className="inline-flex items-center gap-1.5 min-h-[42px] rounded-full bg-primary-500 px-4 text-xs font-bold text-white hover:bg-primary-600 transition-colors shadow-sm shrink-0"
          >
            Ver pacote <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
};
