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
import {
  COLLECTIONS,
  db,
  isMissingIndexError,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { SEED_TRIPS } from './seedCatalog';
import { isSafeRasterDataUrl } from '@/utils/securitySanitizer';
import { slugify } from '@/utils/slugUtils';
import {
  BoardingPoint,
  ItineraryDay,
  PassengerConfig,
  TravelerType,
  Trip,
  TripCategory,
  TripDeparture,
  TripOperationalData,
} from '@/types';

const VALID_CATEGORIES = new Set<TripCategory>([
  'PRAIA',
  'AVENTURA',
  'NATUREZA',
  'HISTORIA',
  'GASTRONOMIA',
  'ROMANTICO',
  'VIDA_NOTURNA',
  'CULTURA',
  'ARTE',
  'VIAGEM_BARATA',
]);

const DEFAULT_PASSENGER_CONFIG: PassengerConfig = {
  allowChildren: true,
  childAgeLimit: 12,
  childPriceMultiplier: 0.7,
};

function sanitizeStringArray(value: unknown, maxItems = 50): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems);
}

export function normalizeDepartures(
  value: unknown,
  fallbackMaxGuests: number,
  durationDays: number
): TripDeparture[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => {
      const startIso = toIsoTimestamp(item.startDate);
      const computedEnd = startIso
        ? new Date(new Date(startIso).getTime() + durationDays * 86_400_000).toISOString()
        : '';
      const endIso = toIsoTimestamp(item.endDate, computedEnd);
      const maxG = Number.isFinite(Number(item.maxGuests))
        ? Math.max(1, Math.min(10_000, Math.round(Number(item.maxGuests))))
        : fallbackMaxGuests;
      const avail = Number.isFinite(Number(item.availableSpots))
        ? Math.max(0, Math.min(maxG, Math.round(Number(item.availableSpots))))
        : maxG;
      const priceOverride =
        item.priceOverride !== undefined &&
        item.priceOverride !== null &&
        Number.isFinite(Number(item.priceOverride)) &&
        Number(item.priceOverride) >= 0
          ? Number(item.priceOverride)
          : undefined;

      return {
        id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `dep-${idx + 1}`,
        startDate: startIso,
        endDate: endIso,
        maxGuests: maxG,
        availableSpots: avail,
        ...(priceOverride !== undefined ? { priceOverride } : {}),
      };
    })
    .filter((dep) => dep.startDate.length > 0)
    .slice(0, 30);
}

export function computeRemainingSpots(
  trip: Pick<Trip, 'maxGuests' | 'availableSpots' | 'departures'>,
  departureDate?: string
): number {
  const fallbackMax = Math.max(0, trip.maxGuests ?? 16);
  if (departureDate && Array.isArray(trip.departures) && trip.departures.length > 0) {
    const targetDay = departureDate.slice(0, 10);
    const matched = trip.departures.find((d) => d.startDate.slice(0, 10) === targetDay);
    if (matched) {
      return Math.max(0, matched.availableSpots);
    }
  }
  if (typeof trip.availableSpots === 'number' && Number.isFinite(trip.availableSpots)) {
    return Math.max(0, trip.availableSpots);
  }
  return fallbackMax;
}

export function normalizeTripDoc(id: string, raw: Record<string, unknown>): Trip {
  const categoryCandidate = raw.category as TripCategory | undefined;
  const category: TripCategory =
    categoryCandidate && VALID_CATEGORIES.has(categoryCandidate) ? categoryCandidate : 'NATUREZA';

  const rawImages = sanitizeStringArray(raw.images, 20);
  const fallbackCover =
    (typeof raw.coverImage === 'string' && raw.coverImage.trim()) ||
    (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) ||
    '';
  const images = rawImages.length > 0 ? rawImages : fallbackCover ? [fallbackCover] : [];

  const rawPassengerCfg =
    raw.passengerConfig && typeof raw.passengerConfig === 'object'
      ? (raw.passengerConfig as Partial<PassengerConfig>)
      : {};

  const passengerConfig: PassengerConfig = {
    allowChildren:
      typeof rawPassengerCfg.allowChildren === 'boolean'
        ? rawPassengerCfg.allowChildren
        : DEFAULT_PASSENGER_CONFIG.allowChildren,
    childAgeLimit:
      typeof rawPassengerCfg.childAgeLimit === 'number' &&
      Number.isFinite(rawPassengerCfg.childAgeLimit)
        ? rawPassengerCfg.childAgeLimit
        : DEFAULT_PASSENGER_CONFIG.childAgeLimit,
    childPriceMultiplier:
      typeof rawPassengerCfg.childPriceMultiplier === 'number' &&
      Number.isFinite(rawPassengerCfg.childPriceMultiplier)
        ? rawPassengerCfg.childPriceMultiplier
        : DEFAULT_PASSENGER_CONFIG.childPriceMultiplier,
  };

  const itinerary: ItineraryDay[] = Array.isArray(raw.itinerary)
    ? raw.itinerary
        .filter((d): d is Record<string, unknown> => Boolean(d && typeof d === 'object'))
        .map((d, idx) => ({
          day: typeof d.day === 'number' && Number.isFinite(d.day) ? d.day : idx + 1,
          title: typeof d.title === 'string' ? d.title : `Dia ${idx + 1}`,
          description: typeof d.description === 'string' ? d.description : '',
        }))
    : [];

  const boardingPoints: BoardingPoint[] = Array.isArray(raw.boardingPoints)
    ? raw.boardingPoints
        .filter((b): b is Record<string, unknown> => Boolean(b && typeof b === 'object'))
        .map((b, idx) => ({
          id: typeof b.id === 'string' && b.id ? b.id : `bp-${idx + 1}`,
          time: typeof b.time === 'string' && b.time ? b.time : '07:00',
          location: typeof b.location === 'string' ? b.location : '',
        }))
        .filter((b) => b.location.length > 0)
    : [];

  const nowIso = new Date().toISOString();
  const startDate = toIsoTimestamp(raw.startDate, nowIso);
  const durationDays = Math.max(1, Math.min(365, Math.round(Number(raw.durationDays) || 1)));
  const computedEndIso = new Date(
    new Date(startDate).getTime() + durationDays * 86_400_000
  ).toISOString();
  const endDate = toIsoTimestamp(raw.endDate, computedEndIso);
  const createdAt = toIsoTimestamp(raw.createdAt);
  const updatedAt = toIsoTimestamp(raw.updatedAt);

  const rawMaxGuests = Number(raw.maxGuests ?? raw.maxSpots ?? 16);
  const maxGuests =
    Number.isFinite(rawMaxGuests) && rawMaxGuests >= 0 ? Math.round(rawMaxGuests) : 16;

  const rawAvailable =
    raw.availableSpots !== undefined && raw.availableSpots !== null
      ? Number(raw.availableSpots)
      : maxGuests;
  const availableSpots =
    Number.isFinite(rawAvailable) && rawAvailable >= 0
      ? Math.min(10_000, Math.round(rawAvailable))
      : maxGuests;

  const departures = normalizeDepartures(raw.departures, maxGuests, durationDays);

  const rawLat = raw.latitude !== undefined && raw.latitude !== null ? Number(raw.latitude) : NaN;
  const latitude = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : undefined;

  const rawLng =
    raw.longitude !== undefined && raw.longitude !== null ? Number(raw.longitude) : NaN;
  const longitude = Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : undefined;

  return {
    id,
    agencyId: typeof raw.agencyId === 'string' ? raw.agencyId : '',
    agencyName:
      typeof raw.agencyName === 'string' && raw.agencyName.trim()
        ? raw.agencyName.trim()
        : 'Agência Parceira',
    agencySlug: typeof raw.agencySlug === 'string' ? raw.agencySlug : '',
    title:
      typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Roteiro SouNativo',
    slug: typeof raw.slug === 'string' && raw.slug.trim() ? raw.slug.trim() : id,
    description: typeof raw.description === 'string' ? raw.description : '',
    destination: typeof raw.destination === 'string' ? raw.destination : 'Brasil',
    ...(typeof raw.state === 'string' ? { state: raw.state } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    price: Number.isFinite(Number(raw.price)) ? Math.max(0, Number(raw.price)) : 0,
    startDate,
    endDate,
    durationDays,
    images,
    category,
    tags: sanitizeStringArray(raw.tags, 30),
    travelerTypes: sanitizeStringArray(raw.travelerTypes, 10) as TravelerType[],
    itinerary,
    boardingPoints,
    ...(departures.length > 0 ? { departures } : {}),
    paymentMethods: sanitizeStringArray(raw.paymentMethods, 10),
    included: sanitizeStringArray(raw.included, 50),
    notIncluded: sanitizeStringArray(raw.notIncluded, 50),
    maxGuests,
    availableSpots,
    passengerConfig,
    ...(raw.operationalData && typeof raw.operationalData === 'object'
      ? { operationalData: raw.operationalData as TripOperationalData }
      : {}),
    rating: Number.isFinite(Number(raw.rating)) ? Math.min(5, Math.max(0, Number(raw.rating))) : 0,
    totalReviews: Number.isFinite(Number(raw.totalReviews))
      ? Math.max(0, Math.round(Number(raw.totalReviews)))
      : 0,
    featured: Boolean(raw.featured),
    isActive: Boolean(raw.isActive),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function sortTripsFeaturedAndRecent(items: Trip[]): Trip[] {
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export async function fetchActiveTrips(): Promise<Trip[]> {
  if (!db) return SEED_TRIPS;

  try {
    let liveTrips: Trip[] = [];
    try {
      const q = query(
        collection(db, COLLECTIONS.trips),
        where('isActive', '==', true),
        orderBy('featured', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(40)
      );
      const snap = await getDocs(q);
      liveTrips = snap.docs.map((docSnap) =>
        normalizeTripDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
    } catch (innerErr: unknown) {
      if (!isMissingIndexError(innerErr)) throw innerErr;
      console.warn(
        '[tripService.fetchActiveTrips] Índice composto ausente; executando busca direta com ordenação local.'
      );
      const fallbackSnap = await getDocs(
        query(collection(db, COLLECTIONS.trips), where('isActive', '==', true), limit(40))
      );
      liveTrips = sortTripsFeaturedAndRecent(
        fallbackSnap.docs.map((docSnap) =>
          normalizeTripDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
        )
      );
    }

    if (liveTrips.length === 0) return SEED_TRIPS;

    const liveSlugs = new Set(liveTrips.map((t) => t.slug));
    return [...liveTrips, ...SEED_TRIPS.filter((t) => !liveSlugs.has(t.slug))];
  } catch (err) {
    console.warn('[tripService.fetchActiveTrips] Fallback para catálogo curado:', err);
    return SEED_TRIPS;
  }
}

export async function fetchTripBySlugOrId(slugOrId: string): Promise<Trip | null> {
  const cleanTarget = slugOrId.trim();
  if (!cleanTarget) return null;

  const seedMatch = SEED_TRIPS.find((t) => t.slug === cleanTarget || t.id === cleanTarget) ?? null;

  if (db) {
    try {
      const bySlug = query(
        collection(db, COLLECTIONS.trips),
        where('isActive', '==', true),
        where('slug', '==', cleanTarget),
        limit(1)
      );
      const snap = await getDocs(bySlug);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return normalizeTripDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
      }

      // Skip direct doc lookup when target is already a known showcase seed slug/id
      if (!seedMatch && !cleanTarget.includes('/')) {
        const byId = await getDoc(doc(db, COLLECTIONS.trips, cleanTarget));
        if (byId.exists() && byId.data().isActive === true) {
          return normalizeTripDoc(byId.id, byId.data() as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.warn('[tripService.fetchTripBySlugOrId] Fallback para catálogo curado:', err);
    }
  }

  return seedMatch;
}

export async function fetchTripsByAgency(
  agencyId: string,
  includeInactive = false
): Promise<Trip[]> {
  if (!agencyId) return [];

  if (db) {
    try {
      const constraints = includeInactive
        ? [where('agencyId', '==', agencyId)]
        : [where('agencyId', '==', agencyId), where('isActive', '==', true)];
      const q = query(collection(db, COLLECTIONS.trips), ...constraints);
      const snap = await getDocs(q);
      if (!snap.empty || includeInactive) {
        const list = snap.docs.map((d) =>
          normalizeTripDoc(d.id, d.data() as Record<string, unknown>)
        );
        return sortTripsFeaturedAndRecent(list);
      }
    } catch (err: unknown) {
      if (includeInactive) {
        throw mapFirestoreError(err, 'Erro ao carregar os roteiros da agência.');
      }
      console.warn('[tripService.fetchTripsByAgency] Fallback para catálogo curado:', err);
    }
  }

  return SEED_TRIPS.filter((t) => t.agencyId === agencyId && (includeInactive || t.isActive));
}

export async function createTripInFirestore(
  payload: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'state'>
): Promise<Trip> {
  if (!db) throw new Error('Firestore não configurado.');

  const cleanTitle = payload.title.trim().slice(0, 160);
  if (!cleanTitle) {
    throw new Error('Informe o título do pacote.');
  }

  const baseSlug = slugify(payload.slug || cleanTitle) || 'roteiro';
  const safeSlug = baseSlug.slice(0, 175);
  const safePrice = Number.isFinite(payload.price)
    ? Math.min(1_000_000, Math.max(0, payload.price))
    : 0;
  const safeDuration = Number.isFinite(payload.durationDays)
    ? Math.min(365, Math.max(1, Math.round(payload.durationDays)))
    : 1;
  const safeMaxGuests = Number.isFinite(payload.maxGuests)
    ? Math.min(10_000, Math.max(1, Math.round(payload.maxGuests)))
    : 16;
  const safeAvailableSpots =
    payload.availableSpots !== undefined && Number.isFinite(payload.availableSpots)
      ? Math.min(10_000, Math.max(0, Math.round(payload.availableSpots)))
      : safeMaxGuests;
  const safeDepartures = normalizeDepartures(payload.departures, safeMaxGuests, safeDuration);

  const safeLatitude =
    payload.latitude !== undefined &&
    Number.isFinite(payload.latitude) &&
    payload.latitude >= -90 &&
    payload.latitude <= 90
      ? payload.latitude
      : undefined;
  const safeLongitude =
    payload.longitude !== undefined &&
    Number.isFinite(payload.longitude) &&
    payload.longitude >= -180 &&
    payload.longitude <= 180
      ? payload.longitude
      : undefined;

  const sanitized = {
    agencyId: payload.agencyId,
    agencyName: payload.agencyName.trim().slice(0, 120),
    agencySlug: payload.agencySlug.trim().slice(0, 100),
    title: cleanTitle,
    slug: safeSlug,
    description: payload.description.trim().slice(0, 10_000),
    destination: payload.destination.trim().slice(0, 160),
    ...(safeLatitude !== undefined ? { latitude: safeLatitude } : {}),
    ...(safeLongitude !== undefined ? { longitude: safeLongitude } : {}),
    price: safePrice,
    startDate: payload.startDate,
    endDate: payload.endDate,
    durationDays: safeDuration,
    images: (payload.images ?? [])
      .filter((u) => /^https?:\/\//i.test(u) || isSafeRasterDataUrl(u))
      .slice(0, 20),
    category: payload.category,
    tags: (payload.tags ?? []).slice(0, 30),
    travelerTypes: (payload.travelerTypes ?? []).slice(0, 10),
    itinerary: (payload.itinerary ?? []).slice(0, 60),
    boardingPoints: (payload.boardingPoints ?? []).slice(0, 30),
    ...(safeDepartures.length > 0 ? { departures: safeDepartures } : {}),
    paymentMethods: (payload.paymentMethods ?? []).slice(0, 10),
    included: (payload.included ?? []).slice(0, 50),
    notIncluded: (payload.notIncluded ?? []).slice(0, 50),
    maxGuests: safeMaxGuests,
    availableSpots: safeAvailableSpots,
    passengerConfig: payload.passengerConfig,
    rating: 0,
    totalReviews: 0,
    featured: false,
    isActive: Boolean(payload.isActive),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.trips), {
      ...stripUndefined(sanitized as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const nowIso = new Date().toISOString();
    return {
      id: docRef.id,
      ...sanitized,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Não foi possível publicar o pacote no Firestore.');
  }
}

export type EditableTripFields = Partial<
  Pick<
    Trip,
    | 'title'
    | 'description'
    | 'destination'
    | 'latitude'
    | 'longitude'
    | 'price'
    | 'durationDays'
    | 'startDate'
    | 'endDate'
    | 'category'
    | 'tags'
    | 'images'
    | 'itinerary'
    | 'boardingPoints'
    | 'departures'
    | 'included'
    | 'notIncluded'
    | 'maxGuests'
    | 'availableSpots'
    | 'passengerConfig'
    | 'operationalData'
    | 'isActive'
  >
>;

export async function updateTripInFirestore(
  tripId: string,
  updates: EditableTripFields
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!tripId) throw new Error('Identificador do pacote inválido.');

  const cleaned = stripUndefined(updates as unknown as Record<string, unknown>);
  if (typeof cleaned.title === 'string') {
    cleaned.title = cleaned.title.trim().slice(0, 160);
    if (!cleaned.title) throw new Error('O título do pacote não pode ficar vazio.');
  }
  if (typeof cleaned.description === 'string') {
    cleaned.description = cleaned.description.trim().slice(0, 10_000);
  }
  if (typeof cleaned.destination === 'string') {
    cleaned.destination = cleaned.destination.trim().slice(0, 160);
  }
  if (typeof cleaned.maxGuests === 'number') {
    cleaned.maxGuests = Math.min(10_000, Math.max(1, Math.round(cleaned.maxGuests)));
  }
  if (typeof cleaned.availableSpots === 'number') {
    cleaned.availableSpots = Math.min(10_000, Math.max(0, Math.round(cleaned.availableSpots)));
  }

  try {
    await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
      ...cleaned,
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar pacote no Firestore.');
  }
}

export async function deleteTripInFirestore(tripId: string): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!tripId) throw new Error('Identificador do pacote inválido.');

  try {
    await deleteDoc(doc(db, COLLECTIONS.trips, tripId));
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao excluir pacote no Firestore.');
  }
}
