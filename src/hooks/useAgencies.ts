import { useCallback, useEffect, useState } from 'react';
import { fetchAllAgencies } from '@/services/agencyService';
import { Agency } from '@/types';

export function useAgencies(guidesOnly?: boolean) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAgencies(guidesOnly);
      setAgencies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível carregar os parceiros verificados.'
      );
    } finally {
      setLoading(false);
    }
  }, [guidesOnly]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchAllAgencies(guidesOnly)
      .then((data) => {
        if (active) setAgencies(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar os parceiros verificados.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [guidesOnly]);

  return { agencies, loading, error, reload: loadAgencies };
}
