import { describe, expect, it } from 'vitest';
import {
  formatCurrencyBRL,
  formatDateRange,
  formatShortDate,
  getInitials,
  normalizeSearchText,
} from '@/utils/formatters';

describe('formatters', () => {
  it('formats BRL currency without decimals', () => {
    expect(formatCurrencyBRL(1850)).toContain('1.850');
    expect(formatCurrencyBRL(0)).toContain('0');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatShortDate('not-a-date')).toBe('Data a definir');
    expect(formatDateRange('invalid', '2026-12-10')).toBe('Datas flexíveis');
  });

  it('extracts two-letter initials from full or single names', () => {
    expect(getInitials('Maria Clara Silva')).toBe('MS');
    expect(getInitials('SouNativo')).toBe('SO');
    expect(getInitials('   ')).toBe('SN');
  });

  it('strips diacritics and lowercases search text', () => {
    expect(normalizeSearchText('  São Luís — Lençóis Maranhenses  ')).toBe(
      'sao luis — lencois maranhenses'
    );
  });
});
