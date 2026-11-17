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

export interface PassengerConfig {
  allowChildren: boolean;
  childAgeLimit: number;
  childPriceMultiplier: number;
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
  paymentMethods: string[];
  included: string[];
  notIncluded: string[];
  maxGuests: number;
  passengerConfig: PassengerConfig;
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
  sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'rating';
}
