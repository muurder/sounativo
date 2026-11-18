import { useCallback, useEffect, useState } from 'react';
import {
  createBookingInFirestore,
  fetchUserBookings,
  updateBookingStatusInFirestore,
} from '@/services/bookingService';
import { Booking, BookingStatus } from '@/types';
import { useAuth } from './useAuth';

export function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user?.uid) {
      setBookings([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await fetchUserBookings(user.uid);
      setBookings(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar suas reservas.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const createBooking = useCallback(
    async (payload: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await createBookingInFirestore(payload);
      setBookings((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateStatus = useCallback(
    async (bookingId: string, status: BookingStatus, cancellationReason?: string) => {
      await updateBookingStatusInFirestore(bookingId, status, cancellationReason);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status, ...(cancellationReason ? { cancellationReason } : {}) }
            : b
        )
      );
    },
    []
  );

  return {
    bookings,
    loading,
    error,
    reload: loadBookings,
    createBooking,
    updateStatus,
  };
}
