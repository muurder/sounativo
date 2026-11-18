import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import {
  COLLECTIONS,
  db,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { syncStoredConsentOnAuth } from './privacyService';
import { UserProfile, UserRole } from '@/types';

interface PendingProfileMeta {
  name?: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

let pendingProfileMeta: PendingProfileMeta | null = null;
const inFlightProfileEnsures = new Map<string, Promise<UserProfile>>();

const VALID_ROLES = new Set<UserRole>(['CLIENT', 'AGENCY', 'GUIDE', 'ADMIN']);

export function setPendingProfileMeta(meta: PendingProfileMeta | null): void {
  pendingProfileMeta = meta;
}

export function normalizeUserProfileDoc(
  uid: string,
  raw: Record<string, unknown>,
  fallbackEmail = ''
): UserProfile {
  const roleCandidate = raw.role as UserRole | undefined;
  const role: UserRole = roleCandidate && VALID_ROLES.has(roleCandidate) ? roleCandidate : 'CLIENT';
  const favorites = Array.isArray(raw.favorites)
    ? raw.favorites.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const createdAt = toIsoTimestamp(raw.createdAt);
  const updatedAt = toIsoTimestamp(raw.updatedAt);

  return {
    uid,
    name:
      typeof raw.name === 'string' && raw.name.trim().length > 0
        ? raw.name.trim().slice(0, 120)
        : 'Viajante SouNativo',
    email: typeof raw.email === 'string' ? raw.email : fallbackEmail,
    photoURL:
      typeof raw.photoURL === 'string' && raw.photoURL.length > 0 ? raw.photoURL : undefined,
    role,
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    cpf: typeof raw.cpf === 'string' ? raw.cpf : undefined,
    birthDate: typeof raw.birthDate === 'string' ? raw.birthDate : undefined,
    favorites,
    notificationsEnabled:
      typeof raw.notificationsEnabled === 'boolean' ? raw.notificationsEnabled : true,
    agencyId:
      typeof raw.agencyId === 'string' && raw.agencyId.length > 0 ? raw.agencyId : undefined,
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || !uid) return null;
  try {
    const ref = doc(db, COLLECTIONS.users, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeUserProfileDoc(uid, snap.data() as Record<string, unknown>);
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao carregar perfil do usuário.');
  }
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
    const rawName =
      preferredName?.trim() ||
      pendingProfileMeta?.name?.trim() ||
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split('@')[0]?.trim() ||
      'Viajante SouNativo';
    const resolvedName = rawName.slice(0, 120);
    const validPhotoUrl =
      firebaseUser.photoURL && /^https?:\/\//i.test(firebaseUser.photoURL)
        ? firebaseUser.photoURL.slice(0, 2048)
        : '';

    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      name: resolvedName,
      email: (firebaseUser.email || '').trim().slice(0, 254),
      ...(validPhotoUrl ? { photoURL: validPhotoUrl } : {}),
      role: resolvedRole,
      favorites: [],
      notificationsEnabled: true,
    };

    if (!db) {
      pendingProfileMeta = null;
      return fallbackProfile;
    }

    try {
      const ref = doc(db, COLLECTIONS.users, firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        pendingProfileMeta = null;
        const normalized = normalizeUserProfileDoc(
          firebaseUser.uid,
          snap.data() as Record<string, unknown>,
          fallbackProfile.email
        );
        void syncStoredConsentOnAuth(firebaseUser.uid);
        return normalized;
      }

      await setDoc(ref, {
        ...stripUndefined(fallbackProfile as unknown as Record<string, unknown>),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      pendingProfileMeta = null;
      void syncStoredConsentOnAuth(firebaseUser.uid);
      return fallbackProfile;
    } catch (err: unknown) {
      pendingProfileMeta = null;
      throw mapFirestoreError(err, 'Não foi possível inicializar seu perfil no Firestore.');
    }
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
  if (!db) {
    throw new Error('Firestore não configurado. Configure o .env.local com suas chaves Firebase.');
  }

  const sanitizedUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    const cleanName = updates.name.trim().slice(0, 120);
    if (!cleanName) {
      throw new Error('O nome completo não pode ficar vazio.');
    }
    sanitizedUpdates.name = cleanName;
  }
  if (updates.phone !== undefined) {
    sanitizedUpdates.phone = updates.phone.trim().slice(0, 30);
  }
  if (updates.cpf !== undefined) {
    sanitizedUpdates.cpf = updates.cpf.trim().slice(0, 20);
  }
  if (updates.birthDate !== undefined) {
    sanitizedUpdates.birthDate = updates.birthDate.trim().slice(0, 30);
  }
  if (updates.notificationsEnabled !== undefined) {
    sanitizedUpdates.notificationsEnabled = Boolean(updates.notificationsEnabled);
  }
  if (updates.agencyId !== undefined) {
    sanitizedUpdates.agencyId = updates.agencyId.trim().slice(0, 128);
  }
  if (updates.photoURL !== undefined) {
    const cleanPhoto = updates.photoURL.trim();
    if (cleanPhoto && !/^https?:\/\//i.test(cleanPhoto)) {
      throw new Error('A foto de perfil deve usar uma URL válida (http/https).');
    }
    sanitizedUpdates.photoURL = cleanPhoto.slice(0, 2048);
  }
  if (updates.role !== undefined) {
    sanitizedUpdates.role = updates.role;
  }

  try {
    const ref = doc(db, COLLECTIONS.users, uid);
    await updateDoc(ref, {
      ...stripUndefined(sanitizedUpdates),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao salvar alterações do perfil.');
  }
}

export async function toggleFavoriteInFirestore(
  uid: string,
  tripId: string,
  isCurrentlyFavorite: boolean
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!uid || !tripId) throw new Error('Identificador de usuário ou roteiro inválido.');

  try {
    const ref = doc(db, COLLECTIONS.users, uid);
    await updateDoc(ref, {
      favorites: isCurrentlyFavorite ? arrayRemove(tripId) : arrayUnion(tripId),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Não foi possível atualizar seus favoritos.');
  }
}
