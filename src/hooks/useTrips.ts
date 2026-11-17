import { useEffect, useMemo, useState } from 'react';
import { fetchActiveTrips } from '@/services/tripService';
import { Trip, TripSearchFilters } from '@/types';
import { normalizeSearchText } from '@/utils/formatters';

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

  const filteredTrips = useMemo(() => {
    const queryText = filters?.query ? normalizeSearchText(filters.query) : '';
    const category = filters?.category && filters.category !== 'ALL' ? filters.category : null;

    const result = trips.filter((trip) => {
      if (category && trip.category !== category) return false;
      if (filters?.maxPrice && trip.price > filters.maxPrice) return false;
      if (filters?.travelers && trip.maxGuests < filters.travelers) return false;
      if (queryText) {
        const haystack = normalizeSearchText(
          `${trip.title} ${trip.destination} ${trip.tags.join(' ')} ${trip.agencyName}`
        );
        if (!haystack.includes(queryText)) return false;
      }
      return true;
    });

    if (filters?.sortBy === 'price_asc') return [...result].sort((a, b) => a.price - b.price);
    if (filters?.sortBy === 'price_desc') return [...result].sort((a, b) => b.price - a.price);
    if (filters?.sortBy === 'rating') return [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [
    filters?.category,
    filters?.maxPrice,
    filters?.query,
    filters?.sortBy,
    filters?.travelers,
    trips,
  ]);

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
