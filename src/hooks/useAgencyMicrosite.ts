import { useEffect, useState } from 'react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { useTheme } from '@/context/ThemeContext';
import { Agency, Trip } from '@/types';

export function useAgencyMicrosite(slug: string | undefined) {
  const { setAgencyTheme, resetTheme } = useTheme();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!slug) {
      setAgency(null);
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAgencyBySlug(slug)
      .then(async (found) => {
        if (!active) return;
        setAgency(found);
        if (found?.theme?.colors) {
          setAgencyTheme(found.theme.colors);
        } else {
          resetTheme();
        }
        if (found) {
          const agencyTrips = await fetchTripsByAgency(found.id);
          if (active) setTrips(agencyTrips);
        } else {
          setTrips([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      resetTheme();
    };
  }, [resetTheme, setAgencyTheme, slug]);

  return { agency, trips, loading };
}
