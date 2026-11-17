import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { SEED_REVIEWS, SEED_TRIPS } from './seedCatalog';
import { Trip, TripReview } from '@/types';

export async function fetchActiveTrips(): Promise<Trip[]> {
  if (!db) return SEED_TRIPS;

  try {
    const q = query(
      collection(db, COLLECTIONS.trips),
      where('isActive', '==', true),
      orderBy('featured', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );
    const snap = await getDocs(q);
    if (snap.empty) return SEED_TRIPS;

    const liveTrips = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Trip, 'id'>),
    }));
    const liveSlugs = new Set(liveTrips.map((t) => t.slug));
    return [...liveTrips, ...SEED_TRIPS.filter((t) => !liveSlugs.has(t.slug))];
  } catch {
    return SEED_TRIPS;
  }
}

export async function fetchTripBySlugOrId(slugOrId: string): Promise<Trip | null> {
  if (db) {
    try {
      const bySlug = query(
        collection(db, COLLECTIONS.trips),
        where('isActive', '==', true),
        where('slug', '==', slugOrId),
        limit(1)
      );
      const snap = await getDocs(bySlug);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, ...(docSnap.data() as Omit<Trip, 'id'>) };
      }
    } catch {
      // Fall back to curated catalog below
    }
  }

  return SEED_TRIPS.find((t) => t.slug === slugOrId || t.id === slugOrId) ?? null;
}

export async function fetchTripsByAgency(agencyId: string): Promise<Trip[]> {
  if (db) {
    try {
      const q = query(
        collection(db, COLLECTIONS.trips),
        where('agencyId', '==', agencyId),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }));
      }
    } catch {
      // Fallback
    }
  }

  return SEED_TRIPS.filter((t) => t.agencyId === agencyId && t.isActive);
}

export async function createTripInFirestore(
  payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'state'>
): Promise<Trip> {
  if (!db) throw new Error('Firestore não configurado.');
  const sanitized = {
    agencyId: payload.agencyId,
    agencyName: payload.agencyName,
    agencySlug: payload.agencySlug,
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    destination: payload.destination,
    price: payload.price,
    startDate: payload.startDate,
    endDate: payload.endDate,
    durationDays: payload.durationDays,
    images: payload.images,
    category: payload.category,
    tags: payload.tags,
    travelerTypes: payload.travelerTypes,
    itinerary: payload.itinerary,
    boardingPoints: payload.boardingPoints,
    paymentMethods: payload.paymentMethods,
    included: payload.included,
    notIncluded: payload.notIncluded,
    maxGuests: payload.maxGuests,
    passengerConfig: payload.passengerConfig,
    rating: 0,
    totalReviews: 0,
    featured: false,
    isActive: payload.isActive,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.trips), {
    ...sanitized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...sanitized };
}

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
      // Fallback
    }
  }
  return SEED_REVIEWS.filter((r) => r.tripId === tripId);
}
