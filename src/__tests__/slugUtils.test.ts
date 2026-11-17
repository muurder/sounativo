import { describe, expect, it } from 'vitest';
import { isValidSlug, slugify } from '@/utils/slugUtils';

describe('slugUtils', () => {
  it('converts Portuguese strings with diacritics into valid URL slugs', () => {
    expect(slugify('Paraíso das Cataratas — Foz do Iguaçu!')).toBe(
      'paraiso-das-cataratas-foz-do-iguacu'
    );
  });

  it('validates canonical lowercase hyphenated slugs', () => {
    expect(isValidSlug('trilhas-do-cerrado-2026')).toBe(true);
    expect(isValidSlug('Amazônia-Viva')).toBe(false);
    expect(isValidSlug('-invalido-')).toBe(false);
  });
});
