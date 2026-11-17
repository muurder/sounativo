import { useEffect, useState } from 'react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchTripBySlugOrId } from '@/services/tripService';
import { fetchReviewsForTrip } from '@/services/reviewService';
import { useTheme } from '@/context/ThemeContext';
import { Agency, Trip, TripReview } from '@/types';

export function useTripDetails(targetSlug?: string, agencySlug?: string) {
  const { setAgencyBrand, setAgencyTheme, resetTheme } = useTheme();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!targetSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTripBySlugOrId(targetSlug)
      .then(async (found) => {
        if (!active) return;
        setTrip(found);
        if (found) {
          const [foundAgency, foundReviews] = await Promise.all([
            fetchAgencyBySlug(found.agencySlug),
            fetchReviewsForTrip(found.id),
          ]);
          if (active) {
            setAgency(foundAgency);
            setReviews(foundReviews);
            if (agencySlug && foundAgency) {
              setAgencyBrand({
                name: foundAgency.name,
                slug: foundAgency.slug,
                logo: foundAgency.logo,
              });
              if (foundAgency.theme) setAgencyTheme(foundAgency.theme);
            }
          }
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

  return { trip, agency, reviews, setReviews, loading };
}
