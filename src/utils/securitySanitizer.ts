const CSRF_SESSION_KEY = 'sounativo_csrf_token_v1';

// Matches ASCII control chars (except \t, \n, \r) and Unicode bidirectional spoof chars
const UNSAFE_TEXT_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Validates external URLs against XSS / protocol injection (blocks javascript:, data:, vbscript:, file:).
 * Allows strictly http: and https: protocols and strips embedded credentials.
 */
export function sanitizeExternalUrl(rawUrl: string | undefined | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizes image sources, allowing HTTPS/HTTP URLs or safe single-slash relative paths (/assets/...).
 * Rejects protocol-relative (//evil.com), javascript:, and arbitrary data:text/html or svg payloads.
 */
export function sanitizeImageSrc(rawSrc: string | undefined | null, fallback: string): string {
  if (!rawSrc) return fallback;
  const trimmed = rawSrc.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  return sanitizeExternalUrl(trimmed) ?? fallback;
}

/**
 * Normalizes user-supplied plain text, stripping invisible control and bidi-override characters
 * and enforcing a strict length ceiling before storage or external dispatch.
 */
export function sanitizePlainText(raw: string | undefined | null, maxLength = 1000): string {
  if (!raw) return '';
  return raw.normalize('NFC').replace(UNSAFE_TEXT_CHARS, '').trim().slice(0, maxLength);
}

/**
 * Generates or retrieves a cryptographically random 256-bit anti-CSRF session token.
 * Complements Firebase Auth signed ID tokens (immune to ambient cookie CSRF) for custom state checks.
 */
export function getOrCreateCsrfToken(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = sessionStorage.getItem(CSRF_SESSION_KEY);
    if (existing && existing.length === 64) return existing;

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(CSRF_SESSION_KEY, token);
    return token;
  } catch {
    return '';
  }
}

/**
 * Constant-length check verifying a state token matches the active session CSRF token.
 */
export function verifyCsrfToken(candidate: string | undefined | null): boolean {
  if (!candidate || typeof window === 'undefined') return false;
  try {
    const expected = sessionStorage.getItem(CSRF_SESSION_KEY);
    if (!expected || expected.length !== candidate.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) {
      diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
