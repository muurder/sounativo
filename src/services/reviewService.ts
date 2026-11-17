import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { SEED_REVIEWS } from './seedCatalog';
import { TripReview } from '@/types';

export async function fetchReviewsForTrip(tripId: string): Promise<TripReview[]> {
  if (db) {
    try {
      const q = query(
        collection(db, COLLECTIONS.reviews),
        where('tripId', '==', tripId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TripReview, 'id'>) }));
      }
    } catch {
      // Fallback to curated showcase reviews
    }
  }
  return SEED_REVIEWS.filter((r) => r.tripId === tripId);
}

export async function fetchRecentReviews(): Promise<TripReview[]> {
  if (db) {
    try {
      const q = query(collection(db, COLLECTIONS.reviews), orderBy('createdAt', 'desc'), limit(8));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const live = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TripReview, 'id'>) }));
        const seen = new Set(live.map((r) => r.id));
        return [...live, ...SEED_REVIEWS.filter((r) => !seen.has(r.id))].slice(0, 8);
      }
    } catch {
      // Fallback to showcase reviews
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

  const sanitized = {
    tripId: input.tripId,
    agencyId: input.agencyId,
    userUid: input.userUid,
    userName: input.userName.trim().slice(0, 120),
    ...(input.userPhotoURL ? { userPhotoURL: input.userPhotoURL } : {}),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: input.comment.trim().slice(0, 2000),
  };

  try {
    const ref = await addDoc(collection(db, COLLECTIONS.reviews), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      ...sanitized,
      createdAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'permission-denied') {
      throw new Error(
        'Este pacote faz parte da vitrine ilustrativa. Avaliações públicas estão habilitadas em pacotes publicados no Firestore.'
      );
    }
    throw err;
  }
}
