import { useEffect, useState } from 'react';
import { fetchAllAgencies } from '@/services/agencyService';
import { Agency } from '@/types';

export function useAgencies(guidesOnly?: boolean) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAllAgencies(guidesOnly)
      .then((data) => {
        if (active) setAgencies(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [guidesOnly]);

  return { agencies, loading };
}
