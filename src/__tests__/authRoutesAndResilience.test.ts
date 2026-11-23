import { describe, expect, it } from 'vitest';
import { RESERVED_AGENCY_SLUGS, sanitizeAgencySlug } from '@/services/agencyService';
import { resolveAuthDomain } from '@/services/firebase.config';
import { RESERVED_ROUTES } from '@/utils/constants';
import vercelConfig from '../../vercel.json';

describe('Auth Routes, Reserved Slugs & Account Creation Resilience', () => {
  it('protects all account creation and authentication slugs from agency collisions', () => {
    const authTerms = [
      'signup',
      'cadastro',
      'cadastrar',
      'criar-conta',
      'registro',
      'register',
      'login',
      'entrar',
      'auth',
    ];

    for (const term of authTerms) {
      expect(
        RESERVED_AGENCY_SLUGS.has(term),
        `Term '${term}' must be in RESERVED_AGENCY_SLUGS`
      ).toBe(true);

      expect(RESERVED_ROUTES.has(term), `Term '${term}' must be in RESERVED_ROUTES`).toBe(true);

      const sanitized = sanitizeAgencySlug(term, 'fallback');
      expect(sanitized).not.toBe(term);
      expect(sanitized).toContain('parceiro');
    }
  });

  it('correctly maps auth hash and query parameters to modal modes', () => {
    const testCases: Array<{ hash?: string; param?: string; expected: 'signup' | 'login' | null }> = [
      { param: 'signup', expected: 'signup' },
      { param: 'login', expected: 'login' },
      { hash: '#signup', expected: 'signup' },
      { hash: '#cadastro', expected: 'signup' },
      { hash: '#criar-conta', expected: 'signup' },
      { hash: '#/signup', expected: 'signup' },
      { hash: '#login', expected: 'login' },
      { hash: '#entrar', expected: 'login' },
      { hash: '#/login', expected: 'login' },
      { hash: '#unknown', expected: null },
      { param: 'other', expected: null },
    ];

    for (const { hash, param, expected } of testCases) {
      const authParam = param === 'login' || param === 'signup' ? param : null;
      const cleanHash = (hash ?? '').replace(/^#\/?/, '').toLowerCase();

      let detected: 'signup' | 'login' | null = null;
      if (authParam === 'login' || authParam === 'signup') {
        detected = authParam;
      } else if (
        cleanHash === 'signup' ||
        cleanHash === 'cadastro' ||
        cleanHash === 'criar-conta' ||
        cleanHash === 'register'
      ) {
        detected = 'signup';
      } else if (cleanHash === 'login' || cleanHash === 'entrar') {
        detected = 'login';
      }

      expect(detected).toBe(expected);
    }
  });

  it('proxies both /__/auth/* and /__/firebase/* before SPA fallback and allows OAuth popup opener communication', () => {
    const rewriteSources = vercelConfig.rewrites.map((r) => r.source);
    const authIdx = rewriteSources.indexOf('/__/auth/(.*)');
    const firebaseIdx = rewriteSources.indexOf('/__/firebase/(.*)');
    const fallbackIdx = rewriteSources.indexOf('/(.*)');

    expect(authIdx).toBeGreaterThan(-1);
    expect(firebaseIdx).toBeGreaterThan(-1);
    expect(fallbackIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(fallbackIdx);
    expect(firebaseIdx).toBeLessThan(fallbackIdx);

    expect(vercelConfig.rewrites[firebaseIdx]?.destination).toBe(
      'https://sounativo-app-br.firebaseapp.com/__/firebase/$1'
    );

    const authHeadersBlock = vercelConfig.headers.find((h) => h.source === '/__/auth/(.*)');
    expect(authHeadersBlock).toBeDefined();
    expect(
      authHeadersBlock?.headers.find((h) => h.key === 'Cross-Origin-Opener-Policy')?.value
    ).toBe('unsafe-none');

    const rootHeadersBlock = vercelConfig.headers.find((h) => h.source === '/(.*)');
    const csp =
      rootHeadersBlock?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain('https://accounts.google.com');
    expect(csp).toContain('https://apis.google.com');
  });

  it('resolves same-origin authDomain for Vercel hosts and trims fallback domain', () => {
    expect(
      resolveAuthDomain('sounativo.vercel.app', 'sounativo.vercel.app', 'sounativo-app-br.firebaseapp.com')
    ).toBe('sounativo.vercel.app');
    expect(
      resolveAuthDomain('viajastore.vercel.app', 'viajastore.vercel.app', 'sounativo-app-br.firebaseapp.com')
    ).toBe('viajastore.vercel.app');
    expect(
      resolveAuthDomain('localhost', 'localhost:3000', ' sounativo-app-br.firebaseapp.com ')
    ).toBe('sounativo-app-br.firebaseapp.com');
  });
});
