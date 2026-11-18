import { ConsentCategories } from '@/types/consent';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: string]: unknown;
  }
}

/**
 * Purges specific cookies by setting their expiration date to the past.
 */
export function purgeCookieByName(namePrefix: string): void {
  if (typeof document === 'undefined') return;

  const cookies = document.cookie.split(';');
  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const eqIdx = trimmed.indexOf('=');
    const name = eqIdx > -1 ? trimmed.slice(0, eqIdx) : trimmed;

    if (name.startsWith(namePrefix)) {
      // Clear for current path and root, across potential host domain variations
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname};`;

      if (domainParts.length >= 2) {
        const rootDomain = `.${domainParts.slice(-2).join('.')}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${rootDomain};`;
      }
    }
  }
}

/**
 * Applies LGPD/GDPR consent preferences to third-party tracking scripts and cookies.
 */
export function applyConsentToScripts(categories: ConsentCategories): void {
  if (typeof window === 'undefined') return;

  // 1. Analytics gating (Google Analytics, GTM, Performance monitoring)
  const gaId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-SOUNATIVO';
  if (!categories.analytics) {
    // Standard Google Analytics opt-out flag
    window[`ga-disable-${gaId}`] = true;

    // Purge Google Analytics cookies if user revoked consent
    purgeCookieByName('_ga');
    purgeCookieByName('_gid');
    purgeCookieByName('_gat');
  } else {
    // If consented, clear any opt-out override
    window[`ga-disable-${gaId}`] = false;
  }

  // 2. Marketing / Retargeting gating (Meta Pixel, Google Ads, TikTok)
  if (!categories.marketing) {
    purgeCookieByName('_fbp');
    purgeCookieByName('_fbc');
    purgeCookieByName('_gcl_au');
  }
}
