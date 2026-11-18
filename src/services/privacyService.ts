import { deleteUser } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, COLLECTIONS, db, serverTimestamp } from './firebase';
import { UserProfile } from '@/types';
import { ConsentCategories } from '@/types/consent';

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

    await updateDoc(doc(db, COLLECTIONS.users, currentUser.uid), {
      privacyConsent: {
        essential: true,
        analytics: Boolean(categories.analytics),
        marketing: Boolean(categories.marketing),
        version: consentVersion.slice(0, 50),
        updatedAt: isoNow,
      },
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-blocking audit sync; localStorage preference remains enforced immediately
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
        profile = { uid: userUid, ...(userSnap.data() as Omit<UserProfile, 'uid'>) };
      }

      const [bookingsSnap, reviewsSnap, consentsSnap] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.bookings), where('clientUid', '==', userUid))),
        getDocs(query(collection(db, COLLECTIONS.reviews), where('userUid', '==', userUid))),
        getDocs(query(collection(db, COLLECTIONS.userConsents), where('userUid', '==', userUid))),
      ]);

      bookingsSnap.forEach((docItem) => bookings.push({ id: docItem.id, ...docItem.data() }));
      reviewsSnap.forEach((docItem) => reviews.push({ id: docItem.id, ...docItem.data() }));
      consentsSnap.forEach((docItem) => consentHistory.push({ id: docItem.id, ...docItem.data() }));
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
 */
export async function deleteUserAccountPermanently(userUid: string): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== userUid) {
    throw new Error('Sessão inválida para exclusão de conta.');
  }

  if (db) {
    // 1. Delete owned agencies and their trips (if partner account)
    const agenciesSnap = await getDocs(
      query(collection(db, COLLECTIONS.agencies), where('ownerUid', '==', userUid))
    );
    for (const agencyDoc of agenciesSnap.docs) {
      const tripsSnap = await getDocs(
        query(collection(db, COLLECTIONS.trips), where('agencyId', '==', agencyDoc.id))
      );
      await Promise.all(tripsSnap.docs.map((t) => deleteDoc(t.ref)));
      await deleteDoc(agencyDoc.ref);
    }

    // 2. Delete authored reviews and consent audit records
    const [reviewsSnap, consentsSnap] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.reviews), where('userUid', '==', userUid))),
      getDocs(query(collection(db, COLLECTIONS.userConsents), where('userUid', '==', userUid))),
    ]);
    await Promise.all([
      ...reviewsSnap.docs.map((r) => deleteDoc(r.ref)),
      ...consentsSnap.docs.map((c) => deleteDoc(c.ref)),
    ]);

    // 3. Delete user profile document
    await deleteDoc(doc(db, COLLECTIONS.users, userUid));
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
    throw err;
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
