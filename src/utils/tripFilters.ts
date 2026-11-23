import { Trip, TripSearchFilters } from '@/types';
import { normalizeSearchText } from './formatters';

export function filterAndSortTrips(
  trips: Trip[] | undefined | null,
  filters?: TripSearchFilters
): Trip[] {
  if (!Array.isArray(trips) || trips.length === 0) return [];

  const queryText = filters?.query ? normalizeSearchText(filters.query) : '';
  const category = filters?.category && filters.category !== 'ALL' ? filters.category : null;
  const monthPrefix = filters?.month?.trim() || '';

  const result = trips.filter((trip) => {
    if (!trip) return false;
    if (category && trip.category !== category) return false;

    const price = typeof trip.price === 'number' && Number.isFinite(trip.price) ? trip.price : 0;
    const baseSpots =
      typeof trip.availableSpots === 'number' && Number.isFinite(trip.availableSpots)
        ? trip.availableSpots
        : typeof trip.maxGuests === 'number' && Number.isFinite(trip.maxGuests)
          ? trip.maxGuests
          : 0;
    const maxDepartureSpots = Array.isArray(trip.departures)
      ? trip.departures.reduce((acc, d) => Math.max(acc, d?.availableSpots ?? 0), 0)
      : 0;
    const effectiveSpots = Math.max(baseSpots, maxDepartureSpots);

    const startDateStr = typeof trip.startDate === 'string' ? trip.startDate : '';
    const matchesMonth =
      !monthPrefix ||
      startDateStr.startsWith(monthPrefix) ||
      (Array.isArray(trip.departures) &&
        trip.departures.some(
          (dep) => typeof dep?.startDate === 'string' && dep.startDate.startsWith(monthPrefix)
        ));

    const safeTags = Array.isArray(trip.tags) ? trip.tags.join(' ') : '';

    if (filters?.maxPrice !== undefined && price > filters.maxPrice) return false;
    if (filters?.travelers !== undefined && effectiveSpots < filters.travelers) return false;
    if (!matchesMonth) return false;

    if (queryText) {
      const haystack = normalizeSearchText(
        `${trip.title ?? ''} ${trip.destination ?? ''} ${safeTags} ${trip.agencyName ?? ''}`
      );
      if (!haystack.includes(queryText)) return false;
    }
    return true;
  });

  if (filters?.sortBy === 'price_asc') {
    return [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  if (filters?.sortBy === 'price_desc') {
    return [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }
  if (filters?.sortBy === 'rating') {
    return [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  return result;
}
