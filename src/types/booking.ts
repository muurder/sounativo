export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

export interface PassengerDetail {
  name: string;
  document?: string;
  phone?: string;
  birthDate?: string;
  type: 'adult' | 'child';
}

export interface Booking {
  id: string;
  tripId: string;
  tripTitle: string;
  tripSlug: string;
  tripImage: string;
  agencyId: string;
  agencyName: string;
  clientUid: string;
  clientName: string;
  clientEmail: string;
  adults: number;
  children: number;
  totalPrice: number;
  departureDate?: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  voucherCode: string;
  passengerDetails: PassengerDetail[];
  notes?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripReview {
  id: string;
  tripId: string;
  agencyId: string;
  bookingId?: string;
  verifiedBooking?: boolean;
  userUid: string;
  userName: string;
  userPhotoURL?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}
