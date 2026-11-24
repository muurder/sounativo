import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
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
import { isSeedShowcaseTrip } from './bookingService';
import { createNotificationInFirestore } from './notificationService';
import { SEED_REVIEWS } from './seedCatalog';
import { TripReview } from '@/types';

export function normalizeReviewDoc(id: string, raw: Record<string, unknown>): TripReview {
  const createdAt = toIsoTimestamp(raw.createdAt);
  const numericRating = Math.round(Number(raw.rating) || 5);
  const bookingId =
    typeof raw.bookingId === 'string' && raw.bookingId.trim() ? raw.bookingId.trim() : undefined;
  const verifiedBooking = Boolean(raw.verifiedBooking || bookingId);

  return {
    id,
    tripId: typeof raw.tripId === 'string' ? raw.tripId : '',
    agencyId: typeof raw.agencyId === 'string' ? raw.agencyId : '',
    ...(bookingId ? { bookingId } : {}),
    verifiedBooking,
    userUid: typeof raw.userUid === 'string' ? raw.userUid : '',
    userName:
      typeof raw.userName === 'string' && raw.userName.trim()
        ? raw.userName.trim()
        : 'Viajante SouNativo',
    ...(typeof raw.userPhotoURL === 'string' && raw.userPhotoURL.length > 0
      ? { userPhotoURL: raw.userPhotoURL }
      : {}),
    rating: Math.max(1, Math.min(5, numericRating)),
    comment: typeof raw.comment === 'string' ? raw.comment : '',
    ...(createdAt ? { createdAt } : {}),
  };
}

function sortReviewsByRecent(items: TripReview[]): TripReview[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export function computeReviewStats(reviews: TripReview[]): {
  rating: number;
  totalReviews: number;
} {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { rating: 0, totalReviews: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  return { rating: avg, totalReviews: reviews.length };
}

export async function fetchReviewsForTrip(tripId: string): Promise<TripReview[]> {
  if (!tripId) return [];

  if (db) {
    try {
      let liveReviews: TripReview[] = [];
      try {
        const q = query(
          collection(db, COLLECTIONS.reviews),
          where('tripId', '==', tripId),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        liveReviews = snap.docs.map((d) =>
          normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
        );
      } catch (innerErr: unknown) {
        if (!isMissingIndexError(innerErr)) throw innerErr;
        console.warn(
          '[reviewService.fetchReviewsForTrip] Índice composto pendente; ordenando em memória.'
        );
        const fallbackSnap = await getDocs(
          query(collection(db, COLLECTIONS.reviews), where('tripId', '==', tripId), limit(30))
        );
        liveReviews = sortReviewsByRecent(
          fallbackSnap.docs.map((d) =>
            normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
          )
        );
      }

      if (liveReviews.length > 0) {
        return liveReviews;
      }
    } catch (err) {
      console.warn('[reviewService.fetchReviewsForTrip] Fallback para avaliações curadas:', err);
    }
  }
  return SEED_REVIEWS.filter((r) => r.tripId === tripId);
}

export async function fetchReviewsByAgency(agencyId: string): Promise<TripReview[]> {
  if (!agencyId) return [];

  if (db) {
    try {
      let liveReviews: TripReview[] = [];
      try {
        const q = query(
          collection(db, COLLECTIONS.reviews),
          where('agencyId', '==', agencyId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        liveReviews = snap.docs.map((d) =>
          normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
        );
      } catch (innerErr: unknown) {
        if (!isMissingIndexError(innerErr)) throw innerErr;
        const fallbackSnap = await getDocs(
          query(collection(db, COLLECTIONS.reviews), where('agencyId', '==', agencyId), limit(50))
        );
        liveReviews = sortReviewsByRecent(
          fallbackSnap.docs.map((d) =>
            normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
          )
        );
      }

      if (liveReviews.length > 0) {
        return liveReviews;
      }
    } catch (err) {
      console.warn('[reviewService.fetchReviewsByAgency] Fallback para avaliações curadas:', err);
    }
  }

  return SEED_REVIEWS.filter((r) => r.agencyId === agencyId);
}

export async function fetchReviewsByUser(userUid: string): Promise<TripReview[]> {
  if (!userUid) return [];

  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.reviews), where('userUid', '==', userUid), limit(50))
      );
      if (!snap.empty) {
        return sortReviewsByRecent(
          snap.docs.map((d) => normalizeReviewDoc(d.id, d.data() as Record<string, unknown>))
        );
      }
    } catch (err) {
      console.warn('[reviewService.fetchReviewsByUser] Falha ao buscar avaliações do usuário:', err);
    }
  }

  return SEED_REVIEWS.filter((r) => r.userUid === userUid);
}

export async function fetchRecentReviews(): Promise<TripReview[]> {
  if (db) {
    try {
      const q = query(collection(db, COLLECTIONS.reviews), orderBy('createdAt', 'desc'), limit(8));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const live = snap.docs.map((d) =>
          normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
        );
        const seen = new Set(live.map((r) => r.id));
        return [...live, ...SEED_REVIEWS.filter((r) => !seen.has(r.id))].slice(0, 8);
      }
    } catch (err) {
      console.warn('[reviewService.fetchRecentReviews] Fallback para avaliações curadas:', err);
    }
  }
  return SEED_REVIEWS;
}

export interface CreateReviewInput {
  tripId: string;
  agencyId: string;
  userUid: string;
  userName: string;
  userPhotoURL?: string;
  rating: number;
  comment: string;
}

export async function createReviewInFirestore(input: CreateReviewInput): Promise<TripReview> {
  if (!db) {
    throw new Error('Conecte o Firebase (.env.local) para publicar avaliações.');
  }

  if (isSeedShowcaseTrip(input.tripId)) {
    throw new Error(
      'Este pacote faz parte da vitrine ilustrativa. Avaliações públicas estão habilitadas em pacotes publicados no Firestore.'
    );
  }

  const cleanComment = input.comment.trim().slice(0, 2000);
  if (cleanComment.length < 3) {
    throw new Error('Escreva um comentário com pelo menos 3 caracteres.');
  }

  // 1. Verified Booking Gate: traveler must hold a CONFIRMED booking on this trip
  const userBookingsSnap = await getDocs(
    query(collection(db, COLLECTIONS.bookings), where('clientUid', '==', input.userUid), limit(50))
  );
  const confirmedBookingDoc = userBookingsSnap.docs.find((docSnap) => {
    const raw = docSnap.data();
    return raw.tripId === input.tripId && raw.status === 'CONFIRMED';
  });

  if (!confirmedBookingDoc) {
    throw new Error(
      'Apenas viajantes com reserva confirmada neste roteiro podem publicar avaliação ("Viagem Verificada").'
    );
  }

  // 2. Anti-spam check: prevent duplicate reviews on the same trip by the same user
  const existingUserReviews = await getDocs(
    query(collection(db, COLLECTIONS.reviews), where('userUid', '==', input.userUid), limit(50))
  );
  const alreadyReviewed = existingUserReviews.docs.some(
    (docSnap) => docSnap.data().tripId === input.tripId
  );
  if (alreadyReviewed) {
    throw new Error('Você já publicou uma avaliação para este roteiro.');
  }

  const validPhoto =
    input.userPhotoURL && /^https?:\/\//i.test(input.userPhotoURL)
      ? input.userPhotoURL.slice(0, 2048)
      : undefined;

  const sanitized = {
    tripId: input.tripId.trim().slice(0, 128),
    agencyId: input.agencyId.trim().slice(0, 128),
    bookingId: confirmedBookingDoc.id,
    verifiedBooking: true,
    userUid: input.userUid.trim().slice(0, 128),
    userName: (input.userName.trim() || 'Viajante SouNativo').slice(0, 120),
    ...(validPhoto ? { userPhotoURL: validPhoto } : {}),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: cleanComment,
  };

  try {
    const ref = await addDoc(collection(db, COLLECTIONS.reviews), {
      ...stripUndefined(sanitized as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created: TripReview = {
      id: ref.id,
      ...sanitized,
      createdAt: new Date().toISOString(),
    };

    // Persist aggregated rating + totalReviews onto trips/{tripId} and agencies/{agencyId}
    void syncPersistedReviewAggregates(sanitized.tripId, sanitized.agencyId, created);

    return created;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'permission-denied') {
      throw new Error(
        'Não foi possível publicar sua avaliação: é necessário possuir uma reserva confirmada neste pacote.'
      );
    }
    throw mapFirestoreError(err, 'Erro ao publicar sua avaliação.');
  }
}

export async function recalculateRatings(tripId?: string, agencyId?: string): Promise<void> {
  if (!db) return;
  try {
    if (tripId) {
      const tripRevSnap = await getDocs(
        query(collection(db, COLLECTIONS.reviews), where('tripId', '==', tripId), limit(100))
      );
      const tripReviews = tripRevSnap.docs.map((d) =>
        normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
      );
      const tripStats = computeReviewStats(tripReviews);
      await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
        rating: tripStats.rating,
        totalReviews: tripStats.totalReviews,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[reviewService] Falha não-bloqueante ao recalcular nota do pacote:', err);
  }

  try {
    if (agencyId) {
      const agencyRevSnap = await getDocs(
        query(collection(db, COLLECTIONS.reviews), where('agencyId', '==', agencyId), limit(100))
      );
      const agencyReviews = agencyRevSnap.docs.map((d) =>
        normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
      );
      const agencyStats = computeReviewStats(agencyReviews);
      await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
        rating: agencyStats.rating,
        totalReviews: agencyStats.totalReviews,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('[reviewService] Falha não-bloqueante ao recalcular nota da agência:', err);
  }
}

async function syncPersistedReviewAggregates(
  tripId: string,
  agencyId: string,
  latestReview: TripReview
): Promise<void> {
  if (!db) return;

  try {
    if (tripId) {
      const tripRevSnap = await getDocs(
        query(collection(db, COLLECTIONS.reviews), where('tripId', '==', tripId), limit(100))
      );
      const tripReviews = tripRevSnap.docs.map((d) =>
        normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
      );
      const tripStats = computeReviewStats(tripReviews);
      if (tripStats.totalReviews >= 1) {
        await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
          rating: tripStats.rating,
          totalReviews: tripStats.totalReviews,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('[reviewService] Falha não-bloqueante ao agregar nota do pacote:', err);
  }

  try {
    if (agencyId) {
      const agencyRevSnap = await getDocs(
        query(collection(db, COLLECTIONS.reviews), where('agencyId', '==', agencyId), limit(100))
      );
      const agencyReviews = agencyRevSnap.docs.map((d) =>
        normalizeReviewDoc(d.id, d.data() as Record<string, unknown>)
      );
      const agencyStats = computeReviewStats(agencyReviews);
      if (agencyStats.totalReviews >= 1) {
        await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
          rating: agencyStats.rating,
          totalReviews: agencyStats.totalReviews,
          updatedAt: serverTimestamp(),
        });
      }

      const agencyDoc = await getDoc(doc(db, COLLECTIONS.agencies, agencyId));
      const ownerUid = agencyDoc.exists() ? (agencyDoc.data()?.ownerUid as string | undefined) : '';
      if (ownerUid && ownerUid !== latestReview.userUid) {
        await createNotificationInFirestore({
          recipientUid: ownerUid,
          type: 'NEW_REVIEW',
          title: `Nova avaliação ${latestReview.rating}.0 ★ recebida`,
          body: `${latestReview.userName}: "${latestReview.comment.slice(0, 120)}"`,
          link: '/dashboard?mode=partner',
        });
      }
    }
  } catch (err) {
    console.warn('[reviewService] Falha não-bloqueante ao agregar nota da agência:', err);
  }
}
