import { Trip, TripSearchFilters } from '@/types';
import { normalizeSearchText } from './formatters';

const BIOME_QUERY_ALIASES: Record<string, readonly string[]> = {
  'chapadas & quedas': ['chapada', 'cachoeira', 'cataratas', 'quedas', 'veadeiros', 'iguacu'],
  'praias & cidades historicas': [
    'paraty',
    'praia',
    'costa verde',
    'ouro preto',
    'barroco',
    'historia',
  ],
  'dunas & lagoas': ['lencois', 'dunas', 'lagoas'],
  'amazonia & rios': ['amazonia', 'rio negro', 'selva'],
  cachoeiras: ['cachoeira', 'cataratas'],
  praias: ['praia', 'costa verde'],
};

export function filterAndSortTrips(
  trips: Trip[] | undefined | null,
  filters?: TripSearchFilters
): Trip[] {
  if (!Array.isArray(trips) || trips.length === 0) return [];

  const queryText = filters?.query ? normalizeSearchText(filters.query) : '';
  const category = filters?.category && filters.category !== 'ALL' ? filters.category : null;
  const monthPrefix = filters?.month?.trim() || '';
  const biomeAliases = queryText ? BIOME_QUERY_ALIASES[queryText] : undefined;

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
    const startDateStr = typeof trip.startDate === 'string' ? trip.startDate : '';
    const deps = Array.isArray(trip.departures) ? trip.departures : [];
    const matchingDeps = monthPrefix
      ? deps.filter(
          (dep) => typeof dep?.startDate === 'string' && dep.startDate.startsWith(monthPrefix)
        )
      : deps;
    const baseMatchesMonth = !monthPrefix || startDateStr.startsWith(monthPrefix);

    if (monthPrefix && !baseMatchesMonth && matchingDeps.length === 0) {
      return false;
    }

    const maxMatchingDepSpots = matchingDeps.reduce(
      (acc, d) => Math.max(acc, d?.availableSpots ?? 0),
      0
    );
    const effectiveSpots = monthPrefix
      ? Math.max(baseMatchesMonth ? baseSpots : 0, maxMatchingDepSpots)
      : Math.max(baseSpots, maxMatchingDepSpots);

    const safeTags = Array.isArray(trip.tags) ? trip.tags.join(' ') : '';
    const boardingText = Array.isArray(trip.boardingPoints)
      ? trip.boardingPoints.map((bp) => bp?.location ?? '').join(' ')
      : '';

    if (filters?.maxPrice !== undefined && price > filters.maxPrice) return false;
    if (filters?.travelers !== undefined && effectiveSpots < filters.travelers) return false;

    if (queryText) {
      const haystack = normalizeSearchText(
        `${trip.title ?? ''} ${trip.destination ?? ''} ${trip.description ?? ''} ${safeTags} ${boardingText} ${trip.agencyName ?? ''}`
      );
      const directMatch = haystack.includes(queryText);
      const aliasMatch = biomeAliases?.some((term) => haystack.includes(term)) ?? false;
      if (!directMatch && !aliasMatch) return false;
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
