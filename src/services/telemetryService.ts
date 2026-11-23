import { addDoc, collection } from 'firebase/firestore';
import { auth, COLLECTIONS, db, serverTimestamp, stripUndefined } from './firebase';
import { CONSENT_STORAGE_KEY, UserConsentState } from '@/types/consent';

const MAX_SESSION_CRASH_LOGS = 20;
const reportedSignatures = new Set<string>();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<UserConsentState>;
    return Boolean(parsed?.hasResponded && parsed?.categories?.analytics === true);
  } catch {
    return false;
  }
}

function ensureGaInitialized(measurementId: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (document.getElementById('sounativo-ga4-loader')) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true, send_page_view: false });

  const script = document.createElement('script');
  script.id = 'sounativo-ga4-loader';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.setAttribute('data-consent-category', 'analytics');
  document.head.appendChild(script);
}

export function trackPageView(pathname: string): void {
  if (!hasAnalyticsConsent()) return;

  const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();
  if (!measurementId) return;

  ensureGaInitialized(measurementId);
  window.gtag?.('event', 'page_view', {
    page_path: pathname || '/',
    page_title: typeof document !== 'undefined' ? document.title : 'SouNativo',
  });
}

export function resetTelemetrySessionCache(): void {
  reportedSignatures.clear();
}

export async function captureRuntimeError(error: unknown, contextRoute?: string): Promise<boolean> {
  if (!db) return false;
  if (reportedSignatures.size >= MAX_SESSION_CRASH_LOGS) return false;

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unhandled runtime exception';
  const cleanMessage = (rawMessage.trim() || 'Unhandled runtime exception').slice(0, 500);

  const routeSource =
    contextRoute || (typeof window !== 'undefined' ? window.location.pathname : '/') || '/';
  const cleanRoute = routeSource.trim().slice(0, 200) || '/';

  const signature = `${cleanRoute}::${cleanMessage}`;
  if (reportedSignatures.has(signature)) {
    return false;
  }
  reportedSignatures.add(signature);

  const stackSnippet =
    error instanceof Error && typeof error.stack === 'string'
      ? error.stack.slice(0, 1500)
      : undefined;
  const userAgent =
    typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
      ? navigator.userAgent.slice(0, 300)
      : undefined;
  const currentUid = auth?.currentUser?.uid;

  const payload = stripUndefined({
    message: cleanMessage,
    route: cleanRoute,
    stackSnippet,
    userAgent,
    ...(currentUid ? { userUid: currentUid } : {}),
  });

  try {
    await addDoc(collection(db, COLLECTIONS.errorLogs), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}
