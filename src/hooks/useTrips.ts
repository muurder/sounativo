import { useEffect, useMemo, useState } from 'react';
import { fetchActiveTrips } from '@/services/tripService';
import { Trip, TripSearchFilters } from '@/types';
import { filterAndSortTrips } from '@/utils/tripFilters';

export function useTrips(filters?: TripSearchFilters) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchActiveTrips()
      .then((data) => {
        if (active) setTrips(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTrips = useMemo(
    () =>
      filterAndSortTrips(trips, {
        query: filters?.query,
        category: filters?.category,
        maxPrice: filters?.maxPrice,
        travelers: filters?.travelers,
        month: filters?.month,
        sortBy: filters?.sortBy,
      }),
    [
      filters?.category,
      filters?.maxPrice,
      filters?.month,
      filters?.query,
      filters?.sortBy,
      filters?.travelers,
      trips,
    ]
  );

  return {
    trips: filteredTrips,
    allTrips: trips,
    loading,
    reload: async () => {
      setLoading(true);
      try {
        setTrips(await fetchActiveTrips());
      } finally {
        setLoading(false);
      }
    },
  };
}
