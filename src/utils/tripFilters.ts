import { Trip, TripSearchFilters } from '@/types';
import { normalizeSearchText } from './formatters';

export function filterAndSortTrips(trips: Trip[], filters?: TripSearchFilters): Trip[] {
  const queryText = filters?.query ? normalizeSearchText(filters.query) : '';
  const category = filters?.category && filters.category !== 'ALL' ? filters.category : null;
  const monthPrefix = filters?.month?.trim() || '';

  const result = trips.filter((trip) => {
    if (category && trip.category !== category) return false;
    if (filters?.maxPrice !== undefined && trip.price > filters.maxPrice) return false;
    if (filters?.travelers !== undefined && trip.maxGuests < filters.travelers) return false;
    if (monthPrefix && !trip.startDate.startsWith(monthPrefix)) return false;
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
}
