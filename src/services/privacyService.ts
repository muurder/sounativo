import { deleteUser } from 'firebase/auth';
import {
  DocumentReference,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  COLLECTIONS,
  db,
  mapFirestoreError,
  serverTimestamp,
  toIsoTimestamp,
} from './firebase';
import { UserProfile } from '@/types';
import {
  CONSENT_STORAGE_KEY,
  ConsentCategories,
  CURRENT_CONSENT_VERSION,
  UserConsentState,
} from '@/types/consent';

export interface ExportedDataPackage {
  metadata: {
    exportDate: string;
    platform: string;
    legalNotice: string;
    userUid: string;
    userEmail: string;
  };
  profile: UserProfile | null;
  bookings: unknown[];
  reviews: unknown[];
  consentHistory: unknown[];
}

const MAX_AUTH_AGE_FOR_DELETE_MS = 4.5 * 60 * 1000;
const FIRESTORE_BATCH_LIMIT = 450;

function normalizeExportRecord(id: string, raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { id, ...raw };
  if ('createdAt' in raw) {
    normalized.createdAt = toIsoTimestamp(raw.createdAt, String(raw.createdAt ?? ''));
  }
  if ('updatedAt' in raw) {
    normalized.updatedAt = toIsoTimestamp(raw.updatedAt, String(raw.updatedAt ?? ''));
  }
  return normalized;
}

async function commitDeletesInChunks(refs: DocumentReference[]): Promise<void> {
  if (!db || refs.length === 0) return;
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    const slice = refs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    for (const ref of slice) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

/**
 * Appends an immutable LGPD Art. 8, § 2º consent record in Firestore when authenticated.
 */
export async function recordConsentAuditLog(
  categories: ConsentCategories,
  consentVersion: string
): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!db || !currentUser) return;

  const isoNow = new Date().toISOString();
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 250) : 'unknown';

  try {
    await addDoc(collection(db, COLLECTIONS.userConsents), {
      userUid: currentUser.uid,
      essential: true,
      analytics: Boolean(categories.analytics),
      marketing: Boolean(categories.marketing),
      consentVersion: consentVersion.slice(0, 50),
      userAgent,
      timestamp: isoNow,
      createdAt: serverTimestamp(),
    });

    const userRef = doc(db, COLLECTIONS.users, currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await updateDoc(userRef, {
        privacyConsent: {
          essential: true,
          analytics: Boolean(categories.analytics),
          marketing: Boolean(categories.marketing),
          version: consentVersion.slice(0, 50),
          updatedAt: isoNow,
        },
        updatedAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-blocking audit sync; localStorage preference remains enforced immediately
  }
}

/**
 * Ensures pre-login CookieBanner decisions stored in localStorage are audited in Firestore
 * once the user authenticates, if no consent audit record exists yet for this account.
 */
export async function syncStoredConsentOnAuth(userUid: string): Promise<void> {
  if (!db || !userUid || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<UserConsentState>;
    if (!parsed?.hasResponded || !parsed.categories) return;

    const existingSnap = await getDocs(
      query(collection(db, COLLECTIONS.userConsents), where('userUid', '==', userUid), limit(1))
    );
    if (!existingSnap.empty) return;

    await recordConsentAuditLog(
      {
        essential: true,
        analytics: Boolean(parsed.categories.analytics),
        marketing: Boolean(parsed.categories.marketing),
      },
      parsed.version || CURRENT_CONSENT_VERSION
    );
  } catch {
    // Non-blocking background sync
  }
}

/**
 * Compiles all personal data of the authenticated user and triggers a .json download.
 * LGPD Art. 18, II e V / GDPR Art. 15 e 20 (Direito de Acesso e Portabilidade dos Dados).
 */
export async function exportUserData(
  userUid: string,
  userEmail: string
): Promise<ExportedDataPackage> {
  let profile: UserProfile | null = null;
  const bookings: unknown[] = [];
  const reviews: unknown[] = [];
  const consentHistory: unknown[] = [];

  if (db) {
    try {
      const userSnap = await getDoc(doc(db, COLLECTIONS.users, userUid));
      if (userSnap.exists()) {
        const rawUser = userSnap.data() as Record<string, unknown>;
        profile = {
          uid: userUid,
          ...(rawUser as Omit<UserProfile, 'uid'>),
          ...(rawUser.createdAt ? { createdAt: toIsoTimestamp(rawUser.createdAt) } : {}),
          ...(rawUser.updatedAt ? { updatedAt: toIsoTimestamp(rawUser.updatedAt) } : {}),
        };
      }

      const [bookingsSnap, reviewsSnap, consentsSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.bookings), where('clientUid', '==', userUid))),
        getDocs(query(collection(db, COLLECTIONS.reviews), where('userUid', '==', userUid))),
        getDocs(query(collection(db, COLLECTIONS.userConsents), where('userUid', '==', userUid))),
      ]);

      bookingsSnap.forEach((docItem) =>
        bookings.push(normalizeExportRecord(docItem.id, docItem.data() as Record<string, unknown>))
      );
      reviewsSnap.forEach((docItem) =>
        reviews.push(normalizeExportRecord(docItem.id, docItem.data() as Record<string, unknown>))
      );
      consentsSnap.forEach((docItem) =>
        consentHistory.push(
          normalizeExportRecord(docItem.id, docItem.data() as Record<string, unknown>)
        )
      );
    } catch (err) {
      console.warn('Erro ao carregar dados do banco para exportação:', err);
    }
  }

  const exportPayload: ExportedDataPackage = {
    metadata: {
      exportDate: new Date().toISOString(),
      platform: 'SouNativo Marketplace (https://sounativo.vercel.app)',
      legalNotice:
        'Arquivo de portabilidade e acesso aos dados pessoais nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD, Art. 18, II e V) e do Regulamento Geral sobre a Proteção de Dados (GDPR, Art. 15 e 20).',
      userUid,
      userEmail,
    },
    profile,
    bookings,
    reviews,
    consentHistory,
  };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sounativo-meus-dados-${safeDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return exportPayload;
}

/**
 * Permanently deletes the user's Firestore documents (owned trips, agencies, reviews, consents, profile)
 * and deletes the Firebase Auth account.
 * LGPD Art. 18, VI / GDPR Art. 17 (Direito à Eliminação dos Dados Pessoais).
 *
 * Pre-validates recent authentication BEFORE touching Firestore so a stale token never leaves
 * a zombie Auth account with destroyed Firestore records.
 */
export async function deleteUserAccountPermanently(userUid: string): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== userUid) {
    throw new Error('Sessão inválida para exclusão de conta.');
  }

  // 0. Pre-flight check: ensure recent sign-in BEFORE deleting any Firestore documents
  const lastSignInIso = currentUser.metadata?.lastSignInTime;
  if (lastSignInIso) {
    const lastSignInMs = new Date(lastSignInIso).getTime();
    if (!Number.isNaN(lastSignInMs) && Date.now() - lastSignInMs > MAX_AUTH_AGE_FOR_DELETE_MS) {
      throw new Error(
        'Por segurança, a exclusão definitiva exige login recente (últimos 5 minutos). Saia e entre novamente antes de excluir sua conta.'
      );
    }
  }

  if (db) {
    try {
      const refsToDelete: DocumentReference[] = [];

      // 1. Collect owned agencies and their trips (if partner account)
      const agenciesSnap = await getDocs(
        query(collection(db, COLLECTIONS.agencies), where('ownerUid', '==', userUid))
      );
      for (const agencyDoc of agenciesSnap.docs) {
        const tripsSnap = await getDocs(
          query(collection(db, COLLECTIONS.trips), where('agencyId', '==', agencyDoc.id))
        );
        tripsSnap.docs.forEach((t) => refsToDelete.push(t.ref));
        refsToDelete.push(agencyDoc.ref);
      }

      // 2. Collect authored reviews and consent audit records
      const [reviewsSnap, consentsSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.reviews), where('userUid', '==', userUid))),
        getDocs(query(collection(db, COLLECTIONS.userConsents), where('userUid', '==', userUid))),
      ]);
      reviewsSnap.docs.forEach((r) => refsToDelete.push(r.ref));
      consentsSnap.docs.forEach((c) => refsToDelete.push(c.ref));

      // 3. Collect user profile document
      refsToDelete.push(doc(db, COLLECTIONS.users, userUid));

      // Commit atomic chunked batches
      await commitDeletesInChunks(refsToDelete);
    } catch (err: unknown) {
      throw mapFirestoreError(err, 'Falha ao eliminar seus registros no banco de dados.');
    }
  }

  // 4. Delete Firebase Auth identity
  try {
    await deleteUser(currentUser);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/requires-recent-login') {
      throw new Error(
        'Por segurança, a exclusão definitiva exige login recente. Saia e entre novamente antes de excluir sua conta.'
      );
    }
    throw mapFirestoreError(err, 'Falha ao remover credencial de autenticação.');
  }

  // 5. Purge browser storage
  if (typeof window !== 'undefined') {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }
  }
}
