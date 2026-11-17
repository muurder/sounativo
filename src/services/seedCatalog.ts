import { Trip } from '@/types';
import { SEED_AGENCIES } from '@/data/seedAgencies';
import { SEED_TRIPS_NORTH_EAST } from '@/data/seedTripsNorthEast';
import { SEED_TRIPS_SOUTH_CENTER } from '@/data/seedTripsSouthCenter';
import { SEED_REVIEWS } from '@/data/seedReviews';

export const SEED_TRIPS: Trip[] = [...SEED_TRIPS_NORTH_EAST, ...SEED_TRIPS_SOUTH_CENTER];
export { SEED_AGENCIES, SEED_REVIEWS };
