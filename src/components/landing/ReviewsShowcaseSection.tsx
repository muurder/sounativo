import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { fetchRecentReviews } from '@/services/reviewService';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatShortDate, getInitials } from '@/utils/formatters';
import { Trip, TripReview } from '@/types';

interface ReviewsShowcaseSectionProps {
  trips: Trip[];
}

export const ReviewsShowcaseSection: React.FC<ReviewsShowcaseSectionProps> = ({ trips }) => {
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchRecentReviews()
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch(() => {
        if (active) setReviews([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const tripById = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '4.9';
    const sum = reviews.reduce((acc, item) => acc + item.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const scrollByCard = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  if (reviews.length === 0) return null;

  return (
    <section className="bg-[var(--surface-alt)] border-b border-stone-200/70 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary-200 bg-white px-3 py-1 text-xs font-bold text-secondary-700">
              <Star
                size={14}
                className="fill-secondary-500 text-secondary-500"
                aria-hidden="true"
              />
              <span>{avgRating} de 5</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-600">{reviews.length} avaliações recentes</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Relatos de quem já embarcou
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-[56ch]">
              Impressões reais sobre condução dos guias, logística de embarque e fidelidade ao
              roteiro anunciado.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Avaliações anteriores"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 hover:border-primary-500 hover:text-primary-700 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Próximas avaliações"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 hover:border-primary-500 hover:text-primary-700 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {reviews.map((review) => {
            const linkedTrip = tripById.get(review.tripId);
            return (
              <article
                key={review.id}
                className="snap-start shrink-0 w-[84vw] sm:w-[350px] lg:w-[370px] rounded-2xl border border-stone-200 bg-white p-6 shadow-card flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-0.5 text-secondary-500"
                      aria-label={`Nota ${review.rating} de 5`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? 'fill-secondary-500 text-secondary-500'
                              : 'text-stone-300'
                          }
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <Quote size={18} className="text-stone-300" aria-hidden="true" />
                  </div>

                  <p className="text-sm text-stone-700 leading-relaxed line-clamp-4">
                    “{review.comment}”
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center gap-3">
                    {review.userPhotoURL ? (
                      <SafeImage
                        src={review.userPhotoURL}
                        alt={review.userName}
                        loading="lazy"
                        className="h-10 w-10 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800 shrink-0">
                        {getInitials(review.userName)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {review.userName}
                      </p>
                      <p className="text-xs text-stone-500">
                        {review.createdAt
                          ? formatShortDate(review.createdAt)
                          : 'Viajante SouNativo'}
                      </p>
                    </div>
                  </div>

                  {linkedTrip && (
                    <Link
                      to={`/viagem/${linkedTrip.slug || linkedTrip.id}`}
                      className="inline-flex items-center justify-between gap-2 w-full rounded-xl bg-stone-50 hover:bg-primary-50 border border-stone-200/80 hover:border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 transition-colors"
                    >
                      <span className="truncate">{linkedTrip.title}</span>
                      <ArrowUpRight size={14} className="shrink-0 text-primary-600" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
