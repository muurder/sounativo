import { beforeEach, describe, expect, it } from 'vitest';
import {
  getOrCreateCsrfToken,
  sanitizeExternalUrl,
  sanitizeImageSrc,
  sanitizePlainText,
  verifyCsrfToken,
} from '@/utils/securitySanitizer';

describe('securitySanitizer (XSS, Protocol Injection & CSRF)', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {};
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, val);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
  });

  it('blocks javascript:, data:, vbscript: and credentials in external URLs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeExternalUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeExternalUrl('https://user:secret@sounativo.vercel.app/trips')).toBe(
      'https://sounativo.vercel.app/trips'
    );
  });

  it('sanitizes image sources and rejects protocol-relative or XSS URIs', () => {
    const fallback = 'https://sounativo.vercel.app/fallback.jpg';
    expect(sanitizeImageSrc('javascript:alert(1)', fallback)).toBe(fallback);
    expect(sanitizeImageSrc('//evil.example.com/x.png', fallback)).toBe(fallback);
    expect(sanitizeImageSrc('/icons/logo.svg', fallback)).toBe('/icons/logo.svg');
    expect(sanitizeImageSrc('https://images.unsplash.com/photo-1', fallback)).toBe(
      'https://images.unsplash.com/photo-1'
    );
  });

  it('strips invisible control and bidirectional override characters from plain text', () => {
    const dirty = '  Olá\u0000\u0007 Mundo\u202E<script>  ';
    expect(sanitizePlainText(dirty, 50)).toBe('Olá Mundo<script>');
  });

  it('creates a 64-hex-char CSRF token and validates constant-length match', () => {
    const token = getOrCreateCsrfToken();
    expect(token).toHaveLength(64);
    expect(verifyCsrfToken(token)).toBe(true);
    expect(verifyCsrfToken('0'.repeat(64))).toBe(false);
    expect(verifyCsrfToken('')).toBe(false);
  });
});
