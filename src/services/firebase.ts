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
} as const;

export { auth, db, firebaseApp, googleProvider, isFirebaseConfigured, serverTimestamp };
