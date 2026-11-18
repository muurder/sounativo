import { beforeEach, describe, expect, it } from 'vitest';
import { applyConsentToScripts } from '@/utils/cookieSecurity';

describe('applyConsentToScripts (LGPD / GDPR Cookie Security)', () => {
  beforeEach(() => {
    (globalThis as unknown as { window: Record<string, unknown> }).window = {
      location: { hostname: 'localhost' },
    };
  });

  it('disables Google Analytics when analytics is rejected', () => {
    applyConsentToScripts({ essential: true, analytics: false, marketing: false });
    expect(window['ga-disable-G-SOUNATIVO']).toBe(true);
  });

  it('enables Google Analytics when analytics is consented', () => {
    applyConsentToScripts({ essential: true, analytics: true, marketing: false });
    expect(window['ga-disable-G-SOUNATIVO']).toBe(false);
  });

  it('handles marketing consent toggles without throwing in SSR or Node', () => {
    expect(() => {
      applyConsentToScripts({ essential: true, analytics: false, marketing: true });
      applyConsentToScripts({ essential: true, analytics: false, marketing: false });
    }).not.toThrow();
  });
});
