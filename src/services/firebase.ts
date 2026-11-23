import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, GoogleAuthProvider, connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  getFirestore,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FIRESTORE_DATABASE_ID,
  USE_FIREBASE_EMULATORS,
  firebaseConfig,
  isFirebaseConfigured,
} from './firebase.config';

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let emulatorsConnected = false;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = FIRESTORE_DATABASE_ID
    ? getFirestore(firebaseApp, FIRESTORE_DATABASE_ID)
    : getFirestore(firebaseApp);

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  if (USE_FIREBASE_EMULATORS && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    emulatorsConnected = true;
  }
}

export const COLLECTIONS = {
  users: 'users',
  agencies: 'agencies',
  trips: 'trips',
  bookings: 'bookings',
  reviews: 'reviews',
  userConsents: 'user_consents',
  contactMessages: 'contact_messages',
  notifications: 'notifications',
  errorLogs: 'error_logs',
} as const;

export function toIsoTimestamp(value: unknown, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : value;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
  }
  if (typeof value === 'object') {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    };
    if (typeof candidate.toDate === 'function') {
      try {
        const dt = candidate.toDate();
        if (dt instanceof Date && !Number.isNaN(dt.getTime())) {
          return dt.toISOString();
        }
      } catch {
        return fallback;
      }
    }
    if (typeof candidate.seconds === 'number' && Number.isFinite(candidate.seconds)) {
      const ms = candidate.seconds * 1000 + Math.floor((candidate.nanoseconds ?? 0) / 1_000_000);
      const dt = new Date(ms);
      return Number.isNaN(dt.getTime()) ? fallback : dt.toISOString();
    }
  }
  return fallback;
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)
          ? stripUndefined(item as Record<string, unknown>)
          : item
      );
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      cleaned[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

export function isMissingIndexError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: string }).code ?? '';
  const message = (err as { message?: string }).message ?? '';
  return code === 'failed-precondition' || /requires an index/i.test(message);
}

export function mapFirestoreError(err: unknown, fallbackMessage: string): Error {
  if (err instanceof Error && !('code' in err)) {
    return err;
  }
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'permission-denied':
      return new Error(
        `${fallbackMessage} Permissão negada pelas regras de segurança do Firestore.`
      );
    case 'unauthenticated':
      return new Error('Sua sessão expirou. Faça login novamente para continuar.');
    case 'unavailable':
    case 'deadline-exceeded':
      return new Error(
        'Serviço temporariamente indisponível. Verifique sua conexão com a internet.'
      );
    case 'not-found':
      return new Error('O registro solicitado não foi encontrado no banco de dados.');
    case 'failed-precondition':
      return new Error(
        `${fallbackMessage} Índice composto pendente no Firestore (execute firebase deploy --only firestore:indexes).`
      );
    case 'resource-exhausted':
      return new Error('Limite temporário de requisições atingido. Aguarde alguns segundos.');
    default:
      return new Error(fallbackMessage);
  }
}

export { auth, db, firebaseApp, googleProvider, isFirebaseConfigured, serverTimestamp };
