import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { SEED_TRIPS } from './seedCatalog';
import { Trip } from '@/types';

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

      const byId = await getDoc(doc(db, COLLECTIONS.trips, slugOrId));
      if (byId.exists() && byId.data().isActive === true) {
        return { id: byId.id, ...(byId.data() as Omit<Trip, 'id'>) };
      }
    } catch {
      // Fall back to curated catalog below
    }
  }

  return SEED_TRIPS.find((t) => t.slug === slugOrId || t.id === slugOrId) ?? null;
}

export async function fetchTripsByAgency(
  agencyId: string,
  includeInactive = false
): Promise<Trip[]> {
  if (db) {
    try {
      const constraints = includeInactive
        ? [where('agencyId', '==', agencyId)]
        : [where('agencyId', '==', agencyId), where('isActive', '==', true)];
      const q = query(collection(db, COLLECTIONS.trips), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty || includeInactive) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }));
      }
    } catch {
      // Fallback for seed showcase agencies
    }
  }

  return SEED_TRIPS.filter((t) => t.agencyId === agencyId && (includeInactive || t.isActive));
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

export type EditableTripFields = Partial<
  Pick<
    Trip,
    | 'title'
    | 'description'
    | 'destination'
    | 'price'
    | 'durationDays'
    | 'startDate'
    | 'endDate'
    | 'category'
    | 'tags'
    | 'images'
    | 'boardingPoints'
    | 'included'
    | 'notIncluded'
    | 'maxGuests'
    | 'passengerConfig'
    | 'isActive'
  >
>;

export async function updateTripInFirestore(
  tripId: string,
  updates: EditableTripFields
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTripInFirestore(tripId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await deleteDoc(doc(db, COLLECTIONS.trips, tripId));
}
