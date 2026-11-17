import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { UserProfile, UserRole } from '@/types';

interface PendingProfileMeta {
  name?: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

let pendingProfileMeta: PendingProfileMeta | null = null;
const inFlightProfileEnsures = new Map<string, Promise<UserProfile>>();

export function setPendingProfileMeta(meta: PendingProfileMeta | null): void {
  pendingProfileMeta = meta;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  const ref = doc(db, COLLECTIONS.users, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  preferredRole?: Exclude<UserRole, 'ADMIN'>,
  preferredName?: string
): Promise<UserProfile> {
  const existingTask = inFlightProfileEnsures.get(firebaseUser.uid);
  if (existingTask) return existingTask;

  const task = (async (): Promise<UserProfile> => {
    const resolvedRole = preferredRole ?? pendingProfileMeta?.role ?? 'CLIENT';
    const resolvedName =
      preferredName?.trim() ||
      pendingProfileMeta?.name?.trim() ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Viajante SouNativo';

    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      name: resolvedName,
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      role: resolvedRole,
      favorites: [],
      notificationsEnabled: true,
    };

    if (!db) {
      pendingProfileMeta = null;
      return fallbackProfile;
    }

    const ref = doc(db, COLLECTIONS.users, firebaseUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      pendingProfileMeta = null;
      const existing = snap.data() as Omit<UserProfile, 'uid'>;
      return { uid: firebaseUser.uid, ...existing };
    }

    await setDoc(ref, {
      ...stripUndefined(fallbackProfile as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    pendingProfileMeta = null;
    return fallbackProfile;
  })().finally(() => {
    inFlightProfileEnsures.delete(firebaseUser.uid);
  });

  inFlightProfileEnsures.set(firebaseUser.uid, task);
  return task;
}

export async function saveUserProfile(
  uid: string,
  updates: Partial<
    Pick<
      UserProfile,
      | 'name'
      | 'phone'
      | 'cpf'
      | 'birthDate'
      | 'notificationsEnabled'
      | 'agencyId'
      | 'photoURL'
      | 'role'
    >
  >
): Promise<void> {
  if (!db)
    throw new Error('Firestore não configurado. Configure o .env.local com suas chaves Firebase.');
  const ref = doc(db, COLLECTIONS.users, uid);
  await updateDoc(ref, {
    ...stripUndefined(updates as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleFavoriteInFirestore(
  uid: string,
  tripId: string,
  isCurrentlyFavorite: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  const ref = doc(db, COLLECTIONS.users, uid);
  await updateDoc(ref, {
    favorites: isCurrentlyFavorite ? arrayRemove(tripId) : arrayUnion(tripId),
    updatedAt: serverTimestamp(),
  });
}
