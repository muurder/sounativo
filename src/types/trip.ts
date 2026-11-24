export type TripCategory =
  | 'PRAIA'
  | 'AVENTURA'
  | 'NATUREZA'
  | 'HISTORIA'
  | 'GASTRONOMIA'
  | 'ROMANTICO'
  | 'VIDA_NOTURNA'
  | 'CULTURA'
  | 'ARTE'
  | 'VIAGEM_BARATA';

export type TravelerType = 'SOZINHO' | 'CASAL' | 'FAMILIA' | 'AMIGOS' | 'MOCHILAO' | 'MELHOR_IDADE';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface BoardingPoint {
  id: string;
  time: string;
  location: string;
}

export interface TripDeparture {
  id: string;
  startDate: string;
  endDate: string;
  maxGuests: number;
  availableSpots: number;
  priceOverride?: number;
}

export interface PassengerConfig {
  allowChildren: boolean;
  childAgeLimit: number;
  childPriceMultiplier: number;
}

export interface OperationalSeatAssignment {
  seatNumber: number;
  passengerName: string;
  bookingId?: string;
  document?: string;
}

export interface OperationalVehicle {
  id: string;
  name: string;
  type: 'BUS' | 'MICROBUS' | 'VAN' | 'SUV';
  capacity: number;
  seats: OperationalSeatAssignment[];
}

export interface OperationalRoom {
  id: string;
  name: string;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | 'SHARED';
  capacity: number;
  guests: string[];
}

export interface OperationalManualPassenger {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  boardingLocation?: string;
}

export interface TripOperationalData {
  vehicles?: OperationalVehicle[];
  rooms?: OperationalRoom[];
  manualPassengers?: OperationalManualPassenger[];
  notes?: string;
}

export interface Trip {
  id: string;
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  title: string;
  slug: string;
  description: string;
  destination: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  images: string[];
  category: TripCategory;
  tags: string[];
  travelerTypes: TravelerType[];
  itinerary: ItineraryDay[];
  boardingPoints: BoardingPoint[];
  departures?: TripDeparture[];
  paymentMethods: string[];
  included: string[];
  notIncluded: string[];
  maxGuests: number;
  availableSpots?: number;
  passengerConfig: PassengerConfig;
  operationalData?: TripOperationalData;
  rating: number;
  totalReviews: number;
  featured: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripSearchFilters {
  query?: string;
  category?: TripCategory | 'ALL';
  maxPrice?: number;
  travelers?: number;
  month?: string;
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'rating';
}
