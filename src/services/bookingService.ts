import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  COLLECTIONS,
  db,
  isMissingIndexError,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { createNotificationInFirestore, dispatchTransactionalAlert } from './notificationService';
import { normalizeDepartures } from './tripService';
import { SEED_TRIPS } from './seedCatalog';
import { Booking, BookingStatus, PassengerDetail, PaymentMethod, TripDeparture } from '@/types';

const SEED_TRIP_IDS = new Set(SEED_TRIPS.map((t) => t.id));
const VALID_STATUSES = new Set<BookingStatus>(['PENDING', 'CONFIRMED', 'CANCELLED']);
const VALID_PAYMENT_METHODS = new Set<PaymentMethod>(['PIX', 'CREDIT_CARD', 'BOLETO']);

export function isSeedShowcaseTrip(tripId: string): boolean {
  return SEED_TRIP_IDS.has(tripId) || tripId.startsWith('trip-');
}

export function applySpotDeltaToTrip(
  rawTrip: Record<string, unknown>,
  guestCount: number,
  deltaSign: -1 | 1,
  departureDate?: string
): { availableSpots: number; departures?: TripDeparture[] } {
  const safeGuests = Math.max(1, Math.round(guestCount));
  const maxGuests = Number.isFinite(Number(rawTrip.maxGuests))
    ? Math.max(1, Math.round(Number(rawTrip.maxGuests)))
    : 16;
  const durationDays = Number.isFinite(Number(rawTrip.durationDays))
    ? Math.max(1, Math.round(Number(rawTrip.durationDays)))
    : 1;
  const currentAvailable =
    rawTrip.availableSpots !== undefined &&
    rawTrip.availableSpots !== null &&
    Number.isFinite(Number(rawTrip.availableSpots))
      ? Math.max(0, Math.round(Number(rawTrip.availableSpots)))
      : maxGuests;

  const departures = normalizeDepartures(rawTrip.departures, maxGuests, durationDays);

  if (departureDate && departures.length > 0) {
    const targetDay = departureDate.slice(0, 10);
    const matchIdx = departures.findIndex((dep) => dep.startDate.slice(0, 10) === targetDay);
    if (matchIdx >= 0) {
      const targetDep = departures[matchIdx];
      const nextDepSpots = targetDep.availableSpots + deltaSign * safeGuests;
      if (deltaSign === -1 && nextDepSpots < 0) {
        throw new Error(
          `Não há vagas suficientes nesta turma (disponíveis: ${targetDep.availableSpots}, solicitadas: ${safeGuests}).`
        );
      }
      const clampedDepSpots = Math.min(targetDep.maxGuests, Math.max(0, nextDepSpots));
      const updatedDepartures = departures.map((dep, idx) =>
        idx === matchIdx ? { ...dep, availableSpots: clampedDepSpots } : dep
      );
      return {
        availableSpots: currentAvailable,
        departures: updatedDepartures,
      };
    }
  }

  const nextAvailable = currentAvailable + deltaSign * safeGuests;
  if (deltaSign === -1 && nextAvailable < 0) {
    throw new Error(
      `Não há vagas suficientes neste roteiro (disponíveis: ${currentAvailable}, solicitadas: ${safeGuests}).`
    );
  }

  return {
    availableSpots: Math.min(maxGuests, Math.max(0, nextAvailable)),
    ...(departures.length > 0 ? { departures } : {}),
  };
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
  const departureDate =
    typeof raw.departureDate === 'string' && raw.departureDate.trim()
      ? raw.departureDate.trim()
      : toIsoTimestamp(raw.departureDate);

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
    ...(departureDate ? { departureDate } : {}),
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
  const safeDepartureDate = payload.departureDate
    ? payload.departureDate.trim().slice(0, 40)
    : undefined;

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
    ...(safeDepartureDate ? { departureDate: safeDepartureDate } : {}),
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
    const createdBooking: Booking = {
      id: docRef.id,
      ...sanitized,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Non-blocking in-app notification + optional transactional email/webhook alert
    void notifyBookingCreated(createdBooking);

    return createdBooking;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'permission-denied') {
      throw new Error(
        'Não foi possível concluir a reserva: verifique se o pacote ainda possui vagas disponíveis e está ativo.'
      );
    }
    throw mapFirestoreError(err, 'Não foi possível concluir sua reserva.');
  }
}

async function notifyBookingCreated(booking: Booking): Promise<void> {
  if (!db) return;
  try {
    const agencySnap = await getDoc(doc(db, COLLECTIONS.agencies, booking.agencyId));
    const agencyData = agencySnap.exists() ? (agencySnap.data() as Record<string, unknown>) : null;
    const ownerUid = typeof agencyData?.ownerUid === 'string' ? agencyData.ownerUid : '';
    const agencyEmail = typeof agencyData?.email === 'string' ? agencyData.email.trim() : '';
    const totalGuests = booking.adults + booking.children;

    if (ownerUid && ownerUid !== booking.clientUid) {
      await createNotificationInFirestore({
        recipientUid: ownerUid,
        type: 'BOOKING_CREATED',
        title: `Nova reserva: ${booking.tripTitle}`,
        body: `${booking.clientName} solicitou ${totalGuests} vaga(s) · Código ${booking.voucherCode}`,
        link: '/dashboard?mode=partner',
      });
    }

    if (agencyEmail) {
      await dispatchTransactionalAlert({
        event: 'BOOKING_CREATED',
        recipientEmail: agencyEmail,
        recipientName: booking.agencyName,
        subject: `Nova solicitação de reserva (${booking.voucherCode}) — ${booking.tripTitle}`,
        summary: `${booking.clientName} solicitou ${totalGuests} vaga(s) no roteiro "${booking.tripTitle}". Confirme ou gerencie pelo Painel do Parceiro.`,
        voucherCode: booking.voucherCode,
        link: 'https://sounativo.vercel.app/dashboard?mode=partner',
      });
    }

    if (booking.clientUid) {
      await createNotificationInFirestore({
        recipientUid: booking.clientUid,
        type: 'BOOKING_CREATED',
        title: `Solicitação enviada: ${booking.tripTitle}`,
        body: `Pedido ${booking.voucherCode} (${totalGuests} vaga(s)) aguardando confirmação da operadora.`,
        link: '/dashboard',
      });
    }

    if (booking.clientEmail) {
      await dispatchTransactionalAlert({
        event: 'BOOKING_CREATED_CLIENT',
        recipientEmail: booking.clientEmail,
        recipientName: booking.clientName,
        subject: `Recebemos sua solicitação (${booking.voucherCode}) — ${booking.tripTitle}`,
        summary: `Seu pedido de reserva para "${booking.tripTitle}" (${totalGuests} vaga(s)) foi enviado para ${booking.agencyName}. Você será avisado assim que a operadora confirmar.`,
        voucherCode: booking.voucherCode,
        link: 'https://sounativo.vercel.app/dashboard',
      });
    }
  } catch {
    // Non-blocking notification failure ignored cleanly
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: BookingStatus,
  cancellationReason?: string
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!bookingId) throw new Error('Identificador da reserva inválido.');

  const firestoreDb = db;
  const cleanReason = cancellationReason ? cancellationReason.trim().slice(0, 500) : undefined;
  let notifiedBooking: Booking | null = null;

  try {
    try {
      await runTransaction(firestoreDb, async (tx) => {
        const bookingRef = doc(firestoreDb, COLLECTIONS.bookings, bookingId);
        const bookingSnap = await tx.get(bookingRef);
        if (!bookingSnap.exists()) {
          throw new Error('O registro da reserva não foi encontrado.');
        }

        const rawBooking = bookingSnap.data() as Record<string, unknown>;
        const normalized = normalizeBookingDoc(bookingSnap.id, rawBooking);
        notifiedBooking = normalized;

        const prevStatus = normalized.status;
        const deltaSign: -1 | 0 | 1 =
          prevStatus !== 'CONFIRMED' && status === 'CONFIRMED'
            ? -1
            : prevStatus === 'CONFIRMED' && status === 'CANCELLED'
              ? 1
              : 0;

        if (deltaSign !== 0 && normalized.tripId) {
          const tripRef = doc(firestoreDb, COLLECTIONS.trips, normalized.tripId);
          const tripSnap = await tx.get(tripRef);
          if (tripSnap.exists()) {
            const spotUpdates = applySpotDeltaToTrip(
              tripSnap.data() as Record<string, unknown>,
              normalized.adults + normalized.children,
              deltaSign,
              normalized.departureDate
            );
            tx.update(tripRef, {
              ...stripUndefined(spotUpdates as unknown as Record<string, unknown>),
              updatedAt: serverTimestamp(),
            });
          }
        }

        tx.update(bookingRef, {
          status,
          ...(cleanReason ? { cancellationReason: cleanReason } : {}),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (txErr: unknown) {
      const code = (txErr as { code?: string })?.code ?? '';
      // If a traveler cancels their own booking, they cannot mutate trips/{tripId}; fall back to direct booking update
      if (status === 'CANCELLED' && code === 'permission-denied') {
        await updateDoc(doc(firestoreDb, COLLECTIONS.bookings, bookingId), {
          status,
          ...(cleanReason ? { cancellationReason: cleanReason } : {}),
          updatedAt: serverTimestamp(),
        });
      } else {
        throw txErr;
      }
    }

    if (notifiedBooking) {
      void notifyBookingStatusUpdated(notifiedBooking, status, cleanReason);
    }
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar o status da reserva.');
  }
}

async function notifyBookingStatusUpdated(
  booking: Booking,
  nextStatus: BookingStatus,
  reason?: string
): Promise<void> {
  if (!booking.clientUid) return;
  const isConfirmed = nextStatus === 'CONFIRMED';
  const title = isConfirmed
    ? `Reserva confirmada: ${booking.tripTitle}`
    : `Reserva cancelada: ${booking.tripTitle}`;
  const body = isConfirmed
    ? `Sua operadora confirmou o embarque! Voucher: ${booking.voucherCode}.`
    : reason
      ? `Status atualizado para cancelada. Motivo: ${reason}`
      : `A reserva ${booking.voucherCode} foi cancelada.`;

  await createNotificationInFirestore({
    recipientUid: booking.clientUid,
    type: isConfirmed ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
    title,
    body,
    link: '/dashboard',
  });

  await dispatchTransactionalAlert({
    event: isConfirmed ? 'BOOKING_CONFIRMED' : 'BOOKING_CANCELLED',
    recipientEmail: booking.clientEmail,
    recipientName: booking.clientName,
    subject: title,
    summary: body,
    voucherCode: booking.voucherCode,
    link: 'https://sounativo.vercel.app/dashboard',
  });

  const cancelledByClient =
    nextStatus === 'CANCELLED' &&
    Boolean(auth?.currentUser?.uid && auth.currentUser.uid === booking.clientUid);

  if (cancelledByClient && db && booking.agencyId) {
    try {
      const agencySnap = await getDoc(doc(db, COLLECTIONS.agencies, booking.agencyId));
      const agencyData = agencySnap.exists()
        ? (agencySnap.data() as Record<string, unknown>)
        : null;
      const ownerUid = typeof agencyData?.ownerUid === 'string' ? agencyData.ownerUid : '';
      const agencyEmail = typeof agencyData?.email === 'string' ? agencyData.email.trim() : '';

      if (ownerUid && ownerUid !== booking.clientUid) {
        await createNotificationInFirestore({
          recipientUid: ownerUid,
          type: 'BOOKING_CANCELLED',
          title: `Reserva cancelada pelo viajante: ${booking.tripTitle}`,
          body: `${booking.clientName} cancelou a reserva ${booking.voucherCode}.`,
          link: '/dashboard?mode=partner',
        });
      }

      if (agencyEmail) {
        await dispatchTransactionalAlert({
          event: 'BOOKING_CANCELLED',
          recipientEmail: agencyEmail,
          recipientName: booking.agencyName,
          subject: `Cancelamento pelo viajante (${booking.voucherCode}) — ${booking.tripTitle}`,
          summary: `${booking.clientName} cancelou a reserva ${booking.voucherCode} do roteiro "${booking.tripTitle}".${reason ? ` Motivo: ${reason}` : ''}`,
          voucherCode: booking.voucherCode,
          link: 'https://sounativo.vercel.app/dashboard?mode=partner',
        });
      }
    } catch {
      // Non-blocking partner alert
    }
  }
}
