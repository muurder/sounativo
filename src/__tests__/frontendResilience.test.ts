import { describe, expect, it } from 'vitest';
import {
  formatCurrencyBRL,
  formatDateRange,
  formatShortDate,
  getInitials,
  normalizeSearchText,
} from '@/utils/formatters';
import { filterAndSortTrips } from '@/utils/tripFilters';
import { Trip } from '@/types';

describe('Frontend Core Null-Safety & Crash Guards (Phase 2)', () => {
  it('handles null, undefined, and NaN inputs in formatters without throwing or outputting NaN', () => {
    expect(formatCurrencyBRL(undefined)).toContain('0');
    expect(formatCurrencyBRL(Number.NaN)).toContain('0');
    expect(formatShortDate(undefined)).toBe('Data a definir');
    expect(formatDateRange(null, undefined)).toBe('Datas flexíveis');
    expect(getInitials(undefined)).toBe('SN');
    expect(getInitials('   ')).toBe('SN');
    expect(normalizeSearchText(null)).toBe('');
  });

  it('filters malformed Trip objects with missing tags, startDate, or price without crashing', () => {
    const partialTrip = {
      id: 'partial-1',
      title: 'Expedição Pantanal',
      destination: 'Corumbá, MS',
      price: 2100,
      category: 'NATUREZA',
      tags: undefined,
      startDate: undefined,
      maxGuests: undefined,
    } as unknown as Trip;

    expect(filterAndSortTrips(null)).toEqual([]);
    expect(filterAndSortTrips([partialTrip], { query: 'pantanal' })).toHaveLength(1);
    expect(filterAndSortTrips([partialTrip], { month: '2026-12' })).toHaveLength(0);
    expect(filterAndSortTrips([partialTrip], { sortBy: 'rating' })).toHaveLength(1);
  });
});
