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

  const loadBookings = useCallback(async () => {
    if (!user?.uid) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const items = await fetchUserBookings(user.uid);
      setBookings(items);
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

  const updateStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    await updateBookingStatusInFirestore(bookingId, status);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  }, []);

  return {
    bookings,
    loading,
    reload: loadBookings,
    createBooking,
    updateStatus,
  };
}
