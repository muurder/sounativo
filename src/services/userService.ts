import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  COLLECTIONS,
  db,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { syncStoredConsentOnAuth } from './privacyService';
import { isSafeRasterDataUrl } from '@/utils/securitySanitizer';
import { UserAddress, UserProfile, UserRole } from '@/types';

export interface PendingProfileMeta {
  name?: string;
  role: Exclude<UserRole, 'ADMIN'>;
}

let pendingProfileMeta: PendingProfileMeta | null = null;
const inFlightProfileEnsures = new Map<string, Promise<UserProfile>>();

const VALID_ROLES = new Set<UserRole>(['CLIENT', 'AGENCY', 'GUIDE', 'ADMIN']);

export function setPendingProfileMeta(meta: PendingProfileMeta | null): void {
  pendingProfileMeta = meta;
}

export function getPendingProfileMeta(): PendingProfileMeta | null {
  return pendingProfileMeta;
}

async function runWithTokenRefreshRetry<T>(
  firebaseUser: FirebaseUser,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      (code === 'permission-denied' || code === 'unauthenticated') &&
      typeof firebaseUser.getIdToken === 'function'
    ) {
      try {
        await firebaseUser.getIdToken(true);
      } catch {
        throw err;
      }
      return await operation();
    }
    throw err;
  }
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

  const rawAddr =
    raw.address && typeof raw.address === 'object' ? (raw.address as Record<string, unknown>) : null;
  const address: UserAddress | undefined = rawAddr
    ? {
        ...(typeof rawAddr.zipCode === 'string' ? { zipCode: rawAddr.zipCode } : {}),
        ...(typeof rawAddr.street === 'string' ? { street: rawAddr.street } : {}),
        ...(typeof rawAddr.number === 'string' ? { number: rawAddr.number } : {}),
        ...(typeof rawAddr.complement === 'string' ? { complement: rawAddr.complement } : {}),
        ...(typeof rawAddr.district === 'string' ? { district: rawAddr.district } : {}),
        ...(typeof rawAddr.city === 'string' ? { city: rawAddr.city } : {}),
        ...(typeof rawAddr.state === 'string' ? { state: rawAddr.state } : {}),
      }
    : undefined;

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
    ...(address ? { address } : {}),
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

    const resolvedEmail = (firebaseUser.email || '').trim().toLowerCase().slice(0, 254);

    const fallbackProfile: UserProfile = {
      uid: firebaseUser.uid,
      name: resolvedName,
      email: resolvedEmail,
      ...(validPhotoUrl ? { photoURL: validPhotoUrl } : {}),
      role: resolvedRole,
      favorites: [],
      notificationsEnabled: true,
    };

    if (!db) {
      pendingProfileMeta = null;
      return fallbackProfile;
    }

    const firestore = db;

    try {
      const ref = doc(firestore, COLLECTIONS.users, firebaseUser.uid);
      return await runWithTokenRefreshRetry(firebaseUser, async () => {
        const snap = await getDoc(ref);

        if (snap.exists()) {
          pendingProfileMeta = null;
          const normalized = normalizeUserProfileDoc(
            firebaseUser.uid,
            snap.data() as Record<string, unknown>,
            fallbackProfile.email
          );

          const backfill: Record<string, unknown> = {};
          if (!normalized.photoURL && validPhotoUrl) {
            backfill.photoURL = validPhotoUrl;
          }
          if (
            normalized.name === 'Viajante SouNativo' &&
            resolvedName &&
            resolvedName !== 'Viajante SouNativo'
          ) {
            backfill.name = resolvedName;
          }
          if (!normalized.email && resolvedEmail) {
            backfill.email = resolvedEmail;
          }

          if (Object.keys(backfill).length > 0) {
            void updateDoc(ref, {
              ...backfill,
              updatedAt: serverTimestamp(),
            }).catch(() => {});
          }

          void syncStoredConsentOnAuth(firebaseUser.uid);
          return {
            ...normalized,
            ...(typeof backfill.photoURL === 'string' ? { photoURL: backfill.photoURL } : {}),
            ...(typeof backfill.name === 'string' ? { name: backfill.name } : {}),
            ...(typeof backfill.email === 'string' ? { email: backfill.email } : {}),
          };
        }

        await setDoc(ref, {
          ...stripUndefined(fallbackProfile as unknown as Record<string, unknown>),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        pendingProfileMeta = null;
        void syncStoredConsentOnAuth(firebaseUser.uid);
        return fallbackProfile;
      });
    } catch (err: unknown) {
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
      | 'address'
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
  if (updates.address !== undefined && updates.address) {
    sanitizedUpdates.address = {
      zipCode: (updates.address.zipCode ?? '').trim().slice(0, 20),
      street: (updates.address.street ?? '').trim().slice(0, 140),
      number: (updates.address.number ?? '').trim().slice(0, 30),
      complement: (updates.address.complement ?? '').trim().slice(0, 80),
      district: (updates.address.district ?? '').trim().slice(0, 80),
      city: (updates.address.city ?? '').trim().slice(0, 80),
      state: (updates.address.state ?? '').trim().toUpperCase().slice(0, 10),
    };
  }
  if (updates.notificationsEnabled !== undefined) {
    sanitizedUpdates.notificationsEnabled = Boolean(updates.notificationsEnabled);
  }
  if (updates.agencyId !== undefined) {
    sanitizedUpdates.agencyId = updates.agencyId.trim().slice(0, 128);
  }
  if (updates.photoURL !== undefined) {
    const cleanPhoto = updates.photoURL.trim();
    const isDataImg = isSafeRasterDataUrl(cleanPhoto);
    if (cleanPhoto && !isDataImg && !/^https?:\/\//i.test(cleanPhoto)) {
      throw new Error('A foto de perfil deve usar uma URL válida (http/https) ou imagem otimizada.');
    }
    sanitizedUpdates.photoURL = isDataImg ? cleanPhoto : cleanPhoto.slice(0, 2048);
  }
  if (updates.role !== undefined) {
    sanitizedUpdates.role = updates.role;
  }

  const ref = doc(db, COLLECTIONS.users, uid);
  try {
    await updateDoc(ref, {
      ...stripUndefined(sanitizedUpdates),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'not-found') {
      const currentAuthUser = auth?.currentUser?.uid === uid ? auth.currentUser : null;
      const fallbackName =
        (typeof sanitizedUpdates.name === 'string' && sanitizedUpdates.name) ||
        currentAuthUser?.displayName?.trim().slice(0, 120) ||
        'Viajante SouNativo';
      const fallbackEmail = (currentAuthUser?.email || '').trim().toLowerCase().slice(0, 254);
      const fallbackRole: UserRole =
        updates.role && VALID_ROLES.has(updates.role) ? updates.role : 'CLIENT';

      try {
        await setDoc(ref, {
          uid,
          name: fallbackName,
          email: fallbackEmail,
          role: fallbackRole,
          favorites: [],
          notificationsEnabled: true,
          ...stripUndefined(sanitizedUpdates),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      } catch (createErr: unknown) {
        throw mapFirestoreError(createErr, 'Erro ao salvar alterações do perfil.');
      }
    }
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

  const ref = doc(db, COLLECTIONS.users, uid);
  const payload = {
    favorites: isCurrentlyFavorite ? arrayRemove(tripId) : arrayUnion(tripId),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(ref, payload);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'not-found' && auth?.currentUser?.uid === uid) {
      await ensureUserProfile(auth.currentUser);
      try {
        await updateDoc(ref, payload);
        return;
      } catch (retryErr: unknown) {
        throw mapFirestoreError(retryErr, 'Não foi possível atualizar seus favoritos.');
      }
    }
    throw mapFirestoreError(err, 'Não foi possível atualizar seus favoritos.');
  }
}
