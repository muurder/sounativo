import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchTripBySlugOrId } from '@/services/tripService';
import { computeReviewStats, fetchReviewsForTrip } from '@/services/reviewService';
import { useTheme } from '@/context/ThemeContext';
import { Agency, Trip, TripReview } from '@/types';

export function useTripDetails(targetSlug?: string, agencySlug?: string) {
  const { setAgencyBrand, setAgencyTheme, resetTheme } = useTheme();
  const [baseTrip, setBaseTrip] = useState<Trip | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!targetSlug) {
      setBaseTrip(null);
      setAgency(null);
      setReviews([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const found = await fetchTripBySlugOrId(targetSlug);
      setBaseTrip(found);

      if (found) {
        const [agencyResult, reviewsResult] = await Promise.allSettled([
          found.agencySlug ? fetchAgencyBySlug(found.agencySlug) : Promise.resolve(null),
          fetchReviewsForTrip(found.id),
        ]);

        const foundAgency = agencyResult.status === 'fulfilled' ? agencyResult.value : null;
        const foundReviews =
          reviewsResult.status === 'fulfilled' && Array.isArray(reviewsResult.value)
            ? reviewsResult.value
            : [];

        setAgency(foundAgency);
        setReviews(foundReviews);

        if (agencySlug && foundAgency) {
          resetTheme();
          setAgencyBrand({
            name: foundAgency.name,
            slug: foundAgency.slug,
            logo: foundAgency.logo,
          });
          if (foundAgency.theme) setAgencyTheme(foundAgency.theme);
        }
      } else {
        setAgency(null);
        setReviews([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar os detalhes deste roteiro.'
      );
    } finally {
      setLoading(false);
    }
  }, [agencySlug, resetTheme, setAgencyBrand, setAgencyTheme, targetSlug]);

  useEffect(() => {
    let active = true;
    if (!targetSlug) {
      setBaseTrip(null);
      setAgency(null);
      setReviews([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchTripBySlugOrId(targetSlug)
      .then(async (found) => {
        if (!active) return;
        setBaseTrip(found);
        if (found) {
          const [agencyResult, reviewsResult] = await Promise.allSettled([
            found.agencySlug ? fetchAgencyBySlug(found.agencySlug) : Promise.resolve(null),
            fetchReviewsForTrip(found.id),
          ]);
          if (!active) return;

          const foundAgency = agencyResult.status === 'fulfilled' ? agencyResult.value : null;
          const foundReviews =
            reviewsResult.status === 'fulfilled' && Array.isArray(reviewsResult.value)
              ? reviewsResult.value
              : [];

          setAgency(foundAgency);
          setReviews(foundReviews);

          if (agencySlug && foundAgency) {
            resetTheme();
            setAgencyBrand({
              name: foundAgency.name,
              slug: foundAgency.slug,
              logo: foundAgency.logo,
            });
            if (foundAgency.theme) setAgencyTheme(foundAgency.theme);
          }
        } else {
          setAgency(null);
          setReviews([]);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar os detalhes deste roteiro.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (agencySlug) resetTheme();
    };
  }, [agencySlug, resetTheme, setAgencyBrand, setAgencyTheme, targetSlug]);

  const hydratedTrip = useMemo<Trip | null>(() => {
    if (!baseTrip) return null;
    if (reviews.length === 0) return baseTrip;
    const stats = computeReviewStats(reviews);
    return {
      ...baseTrip,
      rating: stats.rating,
      totalReviews: Math.max(baseTrip.totalReviews ?? 0, stats.totalReviews),
    };
  }, [baseTrip, reviews]);

  return {
    trip: hydratedTrip,
    agency,
    reviews,
    setReviews,
    loading,
    error,
    reload: loadDetails,
  };
}
