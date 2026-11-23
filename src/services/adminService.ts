import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  db,
  isMissingIndexError,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { normalizeAgencyDoc } from './agencyService';
import { normalizeBookingDoc } from './bookingService';
import {
  ContactMessageRecord,
  ContactMessageStatus,
  normalizeContactMessageDoc,
} from './contactService';
import { normalizeReviewDoc, recalculateRatings } from './reviewService';
import { normalizeTripDoc } from './tripService';
import { normalizeUserProfileDoc } from './userService';
import {
  Agency,
  Booking,
  PlanTier,
  SubscriptionStatus,
  Trip,
  TripReview,
  UserProfile,
  UserRole,
} from '@/types';

export interface AdminManagedUser extends UserProfile {
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminManagedAgency extends Agency {
  verified?: boolean;
}

export async function fetchAllUsersForAdmin(): Promise<AdminManagedUser[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.users), limit(100)));
    return snap.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      const base = normalizeUserProfileDoc(d.id, raw);
      const status =
        raw.status === 'SUSPENDED' || raw.status === 'ACTIVE' ? raw.status : ('ACTIVE' as const);
      return { ...base, status };
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao listar usuários no console administrativo.');
  }
}

export async function updateUserRoleAsAdmin(
  uid: string,
  role: UserRole,
  status?: 'ACTIVE' | 'SUSPENDED'
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!uid) throw new Error('UID do usuário inválido.');

  try {
    await updateDoc(doc(db, COLLECTIONS.users, uid), {
      ...stripUndefined({
        role,
        ...(status ? { status } : {}),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar papel ou status do usuário.');
  }
}

export async function fetchAllAgenciesForAdmin(): Promise<AdminManagedAgency[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.agencies), limit(100)));
    return snap.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      const base = normalizeAgencyDoc(d.id, raw);
      return {
        ...base,
        verified: Boolean(raw.verified || raw.isVerified),
      };
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao listar agências e guias no console administrativo.');
  }
}

export async function updateAgencyAdminControls(
  agencyId: string,
  updates: {
    verified?: boolean;
    isActive?: boolean;
    subscriptionPlan?: PlanTier;
    requestedPlan?: PlanTier | null;
    subscriptionStatus?: SubscriptionStatus;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!agencyId) throw new Error('Identificador da agência inválido.');

  const resolvedSubscriptionStatus =
    updates.subscriptionStatus ?? (updates.subscriptionPlan ? ('ACTIVE' as const) : undefined);

  try {
    await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
      ...stripUndefined({
        ...updates,
        ...(updates.verified !== undefined ? { isVerified: updates.verified } : {}),
        ...(resolvedSubscriptionStatus ? { subscriptionStatus: resolvedSubscriptionStatus } : {}),
      }),
      ...(updates.requestedPlan === null ? { requestedPlan: null } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao aplicar controles administrativos na agência.');
  }
}

export async function fetchAllTripsForAdmin(): Promise<Trip[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(query(collection(db, COLLECTIONS.trips), limit(100)));
    return snap.docs.map((d) => normalizeTripDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao listar pacotes no console administrativo.');
  }
}

export async function toggleTripFeaturedAsAdmin(tripId: string, featured: boolean): Promise<void> {
  return updateTripAdminControls(tripId, { featured });
}

export async function updateTripAdminControls(
  tripId: string,
  updates: { featured?: boolean; isActive?: boolean }
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!tripId) throw new Error('Identificador do pacote inválido.');

  try {
    await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
      ...stripUndefined({
        ...(updates.featured !== undefined ? { featured: Boolean(updates.featured) } : {}),
        ...(updates.isActive !== undefined ? { isActive: Boolean(updates.isActive) } : {}),
      }),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar pacote no console administrativo.');
  }
}

export async function deleteTripAsAdmin(tripId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!tripId) throw new Error('Identificador do pacote inválido.');

  try {
    await deleteDoc(doc(db, COLLECTIONS.trips, tripId));
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao excluir pacote no console administrativo.');
  }
}

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export async function fetchAllBookingsForAdmin(): Promise<Booking[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.bookings), orderBy('createdAt', 'desc'), limit(100))
    );
    return snap.docs.map((d) => normalizeBookingDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      const fallbackSnap = await getDocs(query(collection(db, COLLECTIONS.bookings), limit(100)));
      return sortByCreatedAtDesc(
        fallbackSnap.docs.map((d) => normalizeBookingDoc(d.id, d.data() as Record<string, unknown>))
      );
    }
    throw mapFirestoreError(err, 'Erro ao listar reservas no console administrativo.');
  }
}

export async function fetchAllContactMessagesForAdmin(): Promise<ContactMessageRecord[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.contactMessages), orderBy('createdAt', 'desc'), limit(100))
    );
    return snap.docs.map((d) =>
      normalizeContactMessageDoc(d.id, d.data() as Record<string, unknown>)
    );
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      const fallbackSnap = await getDocs(
        query(collection(db, COLLECTIONS.contactMessages), limit(100))
      );
      return sortByCreatedAtDesc(
        fallbackSnap.docs.map((d) =>
          normalizeContactMessageDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    }
    throw mapFirestoreError(
      err,
      'Erro ao listar mensagens e solicitações no console administrativo.'
    );
  }
}

export async function updateContactMessageStatusAsAdmin(
  messageId: string,
  status: ContactMessageStatus
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!messageId) throw new Error('Identificador da mensagem inválido.');

  try {
    await updateDoc(doc(db, COLLECTIONS.contactMessages, messageId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar status da solicitação.');
  }
}

export async function deleteContactMessageAsAdmin(messageId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!messageId) throw new Error('Identificador da mensagem inválido.');

  try {
    await deleteDoc(doc(db, COLLECTIONS.contactMessages, messageId));
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao excluir solicitação de atendimento.');
  }
}

export async function fetchAllReviewsForAdmin(): Promise<TripReview[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.reviews), orderBy('createdAt', 'desc'), limit(100))
    );
    return snap.docs.map((d) => normalizeReviewDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      const fallbackSnap = await getDocs(query(collection(db, COLLECTIONS.reviews), limit(100)));
      return sortByCreatedAtDesc(
        fallbackSnap.docs.map((d) => normalizeReviewDoc(d.id, d.data() as Record<string, unknown>))
      );
    }
    throw mapFirestoreError(err, 'Erro ao listar avaliações no console administrativo.');
  }
}

export async function deleteReviewAsAdmin(reviewId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!reviewId) throw new Error('Identificador da avaliação inválido.');

  try {
    const ref = doc(db, COLLECTIONS.reviews, reviewId);
    const snap = await getDoc(ref);
    const data = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    const tripId = typeof data?.tripId === 'string' ? data.tripId : undefined;
    const agencyId = typeof data?.agencyId === 'string' ? data.agencyId : undefined;

    await deleteDoc(ref);
    if (tripId || agencyId) {
      void recalculateRatings(tripId, agencyId);
    }
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao excluir avaliação.');
  }
}

export interface AdminErrorLogRecord {
  id: string;
  message: string;
  route: string;
  stackSnippet?: string;
  userAgent?: string;
  userUid?: string;
  createdAt: string;
}

function normalizeErrorLogDoc(id: string, raw: Record<string, unknown>): AdminErrorLogRecord {
  return {
    id,
    message: typeof raw.message === 'string' ? raw.message : 'Erro desconhecido',
    route: typeof raw.route === 'string' ? raw.route : '/',
    ...(typeof raw.stackSnippet === 'string' && raw.stackSnippet
      ? { stackSnippet: raw.stackSnippet }
      : {}),
    ...(typeof raw.userAgent === 'string' && raw.userAgent ? { userAgent: raw.userAgent } : {}),
    ...(typeof raw.userUid === 'string' && raw.userUid ? { userUid: raw.userUid } : {}),
    createdAt: toIsoTimestamp(raw.createdAt, new Date(0).toISOString()),
  };
}

export async function fetchErrorLogsForAdmin(): Promise<AdminErrorLogRecord[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.errorLogs), orderBy('createdAt', 'desc'), limit(50))
    );
    return snap.docs.map((d) => normalizeErrorLogDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      const fallbackSnap = await getDocs(query(collection(db, COLLECTIONS.errorLogs), limit(50)));
      return sortByCreatedAtDesc(
        fallbackSnap.docs.map((d) =>
          normalizeErrorLogDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    }
    return [];
  }
}

export async function deleteErrorLogAsAdmin(logId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!logId) throw new Error('Identificador do log inválido.');

  try {
    await deleteDoc(doc(db, COLLECTIONS.errorLogs, logId));
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao limpar registro de falha.');
  }
}
