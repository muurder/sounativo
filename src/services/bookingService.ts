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
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { Booking, BookingStatus } from '@/types';

export async function fetchUserBookings(clientUid: string): Promise<Booking[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where('clientUid', '==', clientUid),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }));
}

export async function fetchAgencyBookings(agencyId: string): Promise<Booking[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTIONS.bookings),
    where('agencyId', '==', agencyId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Booking, 'id'>) }));
}

export async function createBookingInFirestore(
  payload: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Booking> {
  if (!db) {
    throw new Error('Conecte o Firebase (.env.local) para concluir reservas reais.');
  }
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.bookings), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...payload };
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'permission-denied') {
      throw new Error(
        'Este roteiro faz parte da vitrine ilustrativa. Publique um pacote real no Modo Agência ou entre em contato via WhatsApp.'
      );
    }
    throw err;
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.bookings, bookingId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
