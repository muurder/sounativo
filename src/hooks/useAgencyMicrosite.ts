import { useCallback, useEffect, useState } from 'react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { useTheme } from '@/context/ThemeContext';
import { Agency, Trip } from '@/types';

export function useAgencyMicrosite(slug: string | undefined) {
  const { setAgencyTheme, setAgencyBrand, resetTheme } = useTheme();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMicrosite = useCallback(async () => {
    if (!slug) {
      resetTheme();
      setAgency(null);
      setTrips([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const found = await fetchAgencyBySlug(slug);
      resetTheme();
      setAgency(found);

      if (found) {
        setAgencyBrand({ name: found.name, slug: found.slug, logo: found.logo });
        if (found.theme) {
          setAgencyTheme(found.theme);
        }
        const agencyTrips = await fetchTripsByAgency(found.id);
        setTrips(Array.isArray(agencyTrips) ? agencyTrips : []);
      } else {
        setTrips([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar o microsite deste parceiro.'
      );
    } finally {
      setLoading(false);
    }
  }, [resetTheme, setAgencyBrand, setAgencyTheme, slug]);

  useEffect(() => {
    let active = true;

    if (!slug) {
      resetTheme();
      setAgency(null);
      setTrips([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchAgencyBySlug(slug)
      .then(async (found) => {
        if (!active) return;
        resetTheme();
        setAgency(found);

        if (found) {
          setAgencyBrand({ name: found.name, slug: found.slug, logo: found.logo });
          if (found.theme) {
            setAgencyTheme(found.theme);
          }
          const agencyTrips = await fetchTripsByAgency(found.id);
          if (active) setTrips(Array.isArray(agencyTrips) ? agencyTrips : []);
        } else {
          setTrips([]);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar o microsite deste parceiro.'
          );
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

  return { agency, trips, loading, error, reload: loadMicrosite };
}
