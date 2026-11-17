import { useEffect, useState } from 'react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { useTheme } from '@/context/ThemeContext';
import { Agency, Trip } from '@/types';

export function useAgencyMicrosite(slug: string | undefined) {
  const { setAgencyTheme, setAgencyBrand, resetTheme } = useTheme();
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
        if (found) {
          setAgencyBrand({ name: found.name, slug: found.slug, logo: found.logo });
          if (found.theme) {
            setAgencyTheme(found.theme);
          }
          const agencyTrips = await fetchTripsByAgency(found.id);
          if (active) setTrips(agencyTrips);
        } else {
          resetTheme();
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
  }, [resetTheme, setAgencyBrand, setAgencyTheme, slug]);

  return { agency, trips, loading };
}
