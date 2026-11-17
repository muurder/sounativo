import { describe, expect, it } from 'vitest';
import { SEED_TRIPS } from '@/services/seedCatalog';
import { filterAndSortTrips } from '@/utils/tripFilters';

describe('filterAndSortTrips', () => {
  it('filters by accent-insensitive search query', () => {
    const res = filterAndSortTrips(SEED_TRIPS, { query: 'Lencois' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('trip-lencois-maranhenses');
  });

  it('filters by minimum guest capacity (?guests param)', () => {
    const res = filterAndSortTrips(SEED_TRIPS, { travelers: 16 });
    expect(res.every((t) => t.maxGuests >= 16)).toBe(true);
    expect(res.length).toBe(2);
  });

  it('filters by maxPrice and category simultaneously', () => {
    const res = filterAndSortTrips(SEED_TRIPS, { category: 'PRAIA', maxPrice: 1000 });
    expect(res).toHaveLength(1);
    expect(res[0].slug).toBe('paraty-trindade-costa-verde');
  });

  it('sorts ascending by price', () => {
    const res = filterAndSortTrips(SEED_TRIPS, { sortBy: 'price_asc' });
    for (let i = 1; i < res.length; i += 1) {
      expect(res[i].price).toBeGreaterThanOrEqual(res[i - 1].price);
    }
  });

  it('filters by departure month prefix (?month param)', () => {
    const res = filterAndSortTrips(SEED_TRIPS, { month: '2026-12' });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((t) => t.startDate.startsWith('2026-12'))).toBe(true);
  });
});
