import {
  addDoc,
  collection,
  doc,
  getDocs,
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
import { Booking, BookingStatus, PassengerDetail, PaymentMethod } from '@/types';

const SEED_TRIP_IDS = new Set(SEED_TRIPS.map((t) => t.id));
const VALID_STATUSES = new Set<BookingStatus>(['PENDING', 'CONFIRMED', 'CANCELLED']);
const VALID_PAYMENT_METHODS = new Set<PaymentMethod>(['PIX', 'CREDIT_CARD', 'BOLETO']);

export function isSeedShowcaseTrip(tripId: string): boolean {
  return SEED_TRIP_IDS.has(tripId) || tripId.startsWith('trip-');
}

export function normalizeBookingDoc(id: string, raw: Record<string, unknown>): Booking {
  const statusCandidate = raw.status as BookingStatus | undefined;
  const paymentCandidate = raw.paymentMethod as PaymentMethod | undefined;
  const passengerDetails: PassengerDetail[] = Array.isArray(raw.passengerDetails)
    ? raw.passengerDetails
        .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
        .map((p) => ({
          name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Passageiro',
          ...(typeof p.document === 'string' && p.document ? { document: p.document } : {}),
          ...(typeof p.phone === 'string' && p.phone ? { phone: p.phone } : {}),
          ...(typeof p.birthDate === 'string' && p.birthDate ? { birthDate: p.birthDate } : {}),
          type: p.type === 'child' ? ('child' as const) : ('adult' as const),
        }))
    : [];

  const createdAt = toIsoTimestamp(raw.createdAt);
  const updatedAt = toIsoTimestamp(raw.updatedAt);

  return {
    id,
    tripId: typeof raw.tripId === 'string' ? raw.tripId : '',
    tripTitle:
      typeof raw.tripTitle === 'string' && raw.tripTitle.trim()
        ? raw.tripTitle.trim()
        : 'Roteiro SouNativo',
    tripSlug: typeof raw.tripSlug === 'string' ? raw.tripSlug : '',
    tripImage: typeof raw.tripImage === 'string' ? raw.tripImage : '',
    agencyId: typeof raw.agencyId === 'string' ? raw.agencyId : '',
    agencyName:
      typeof raw.agencyName === 'string' && raw.agencyName.trim()
        ? raw.agencyName.trim()
        : 'Operadora Parceira',
    clientUid: typeof raw.clientUid === 'string' ? raw.clientUid : '',
    clientName:
      typeof raw.clientName === 'string' && raw.clientName.trim()
        ? raw.clientName.trim()
        : 'Viajante',
    clientEmail: typeof raw.clientEmail === 'string' ? raw.clientEmail : '',
    adults: Math.max(1, Math.round(Number(raw.adults) || 1)),
    children: Math.max(0, Math.round(Number(raw.children) || 0)),
    totalPrice: Number.isFinite(Number(raw.totalPrice)) ? Math.max(0, Number(raw.totalPrice)) : 0,
    status: statusCandidate && VALID_STATUSES.has(statusCandidate) ? statusCandidate : 'PENDING',
    paymentMethod:
      paymentCandidate && VALID_PAYMENT_METHODS.has(paymentCandidate) ? paymentCandidate : 'PIX',
    voucherCode:
      typeof raw.voucherCode === 'string' && raw.voucherCode
        ? raw.voucherCode
        : `SN-${id.slice(0, 6).toUpperCase()}`,
    passengerDetails,
    ...(typeof raw.notes === 'string' && raw.notes.trim() ? { notes: raw.notes.trim() } : {}),
    ...(typeof raw.cancellationReason === 'string' && raw.cancellationReason.trim()
      ? { cancellationReason: raw.cancellationReason.trim() }
      : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function sortBookingsByRecent(items: Booking[]): Booking[] {
  return [...items].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
}

export async function fetchUserBookings(clientUid: string): Promise<Booking[]> {
  if (!db || !clientUid) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.bookings),
      where('clientUid', '==', clientUid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeBookingDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      console.warn(
        '[bookingService.fetchUserBookings] Índice composto pendente; aplicando ordenação em memória.'
      );
      try {
        const fallbackSnap = await getDocs(
          query(collection(db, COLLECTIONS.bookings), where('clientUid', '==', clientUid))
        );
        return sortBookingsByRecent(
          fallbackSnap.docs.map((d) =>
            normalizeBookingDoc(d.id, d.data() as Record<string, unknown>)
          )
        );
      } catch (fallbackErr: unknown) {
        throw mapFirestoreError(fallbackErr, 'Não foi possível carregar suas reservas.');
      }
    }
    throw mapFirestoreError(err, 'Não foi possível carregar suas reservas.');
  }
}

export async function fetchAgencyBookings(agencyId: string): Promise<Booking[]> {
  if (!db || !agencyId) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.bookings),
      where('agencyId', '==', agencyId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeBookingDoc(d.id, d.data() as Record<string, unknown>));
  } catch (err: unknown) {
    if (isMissingIndexError(err)) {
      console.warn(
        '[bookingService.fetchAgencyBookings] Índice composto pendente; aplicando ordenação em memória.'
      );
      try {
        const fallbackSnap = await getDocs(
          query(collection(db, COLLECTIONS.bookings), where('agencyId', '==', agencyId))
        );
        return sortBookingsByRecent(
          fallbackSnap.docs.map((d) =>
            normalizeBookingDoc(d.id, d.data() as Record<string, unknown>)
          )
        );
      } catch (fallbackErr: unknown) {
        throw mapFirestoreError(fallbackErr, 'Não foi possível carregar as reservas recebidas.');
      }
    }
    throw mapFirestoreError(err, 'Não foi possível carregar as reservas recebidas.');
  }
}

export async function createBookingInFirestore(
  payload: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Booking> {
  if (!db) {
    throw new Error('Conecte o Firebase (.env.local) para concluir reservas reais.');
  }

  if (isSeedShowcaseTrip(payload.tripId)) {
    throw new Error(
      'Este roteiro faz parte da vitrine ilustrativa. Publique um pacote real no Modo Agência ou entre em contato via WhatsApp.'
    );
  }

  const adults = Math.max(1, Math.min(100, Math.round(Number(payload.adults) || 1)));
  const children = Math.max(0, Math.min(100, Math.round(Number(payload.children) || 0)));
  const safeImage =
    payload.tripImage && /^https?:\/\//i.test(payload.tripImage)
      ? payload.tripImage.slice(0, 2048)
      : '';
  const safeNotes = payload.notes ? payload.notes.trim().slice(0, 1000) : undefined;

  const sanitized: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
    tripId: payload.tripId.trim().slice(0, 128),
    tripTitle: payload.tripTitle.trim().slice(0, 160),
    tripSlug: payload.tripSlug.trim().slice(0, 180),
    tripImage: safeImage,
    agencyId: payload.agencyId.trim().slice(0, 128),
    agencyName: payload.agencyName.trim().slice(0, 120),
    clientUid: payload.clientUid.trim().slice(0, 128),
    clientName: (payload.clientName || 'Viajante').trim().slice(0, 120),
    clientEmail: (payload.clientEmail || '').trim().toLowerCase().slice(0, 254),
    adults,
    children,
    totalPrice: Math.min(1_000_000, Math.max(0, Number(payload.totalPrice) || 0)),
    status: 'PENDING',
    paymentMethod: VALID_PAYMENT_METHODS.has(payload.paymentMethod) ? payload.paymentMethod : 'PIX',
    voucherCode: payload.voucherCode.trim().slice(0, 40),
    passengerDetails: (payload.passengerDetails ?? []).slice(0, 100).map((p) => ({
      name: (p.name || 'Passageiro').trim().slice(0, 120),
      ...(p.document ? { document: p.document.trim().slice(0, 30) } : {}),
      ...(p.phone ? { phone: p.phone.trim().slice(0, 30) } : {}),
      ...(p.birthDate ? { birthDate: p.birthDate.trim().slice(0, 30) } : {}),
      type: p.type === 'child' ? ('child' as const) : ('adult' as const),
    })),
    ...(safeNotes ? { notes: safeNotes } : {}),
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.bookings), {
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
    const code = (err as { code?: string }).code ?? '';
    if (code === 'permission-denied') {
      throw new Error(
        'Não foi possível concluir a reserva: verifique se o pacote ainda está ativo, dentro do limite máximo de vagas e se sua conta está autenticada.'
      );
    }
    throw mapFirestoreError(err, 'Não foi possível concluir sua reserva.');
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!bookingId) throw new Error('Identificador da reserva inválido.');

  try {
    await updateDoc(doc(db, COLLECTIONS.bookings, bookingId), {
      status,
      ...(cancellationReason
        ? { cancellationReason: cancellationReason.trim().slice(0, 500) }
        : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar o status da reserva.');
  }
}
