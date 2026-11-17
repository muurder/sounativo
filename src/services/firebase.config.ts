export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const SAME_ORIGIN_AUTH_HOSTS = new Set(['sounativo.vercel.app', 'viajastore.vercel.app']);

function resolveAuthDomain(): string {
  const configured = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '';
  if (typeof window !== 'undefined' && SAME_ORIGIN_AUTH_HOSTS.has(window.location.hostname)) {
    return window.location.host;
  }
  return configured;
}

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: resolveAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

export const FIRESTORE_DATABASE_ID = import.meta.env.VITE_FIREBASE_DATABASE_ID?.trim() || undefined;

export const USE_FIREBASE_EMULATORS =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost';

export const MASTER_ADMIN_EMAIL =
  import.meta.env.VITE_MASTER_ADMIN_EMAIL?.trim().toLowerCase() || '';

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
