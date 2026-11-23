import { describe, expect, it } from 'vitest';
import { applySpotDeltaToTrip } from '@/services/bookingService';
import {
  normalizeNotificationDoc,
  sortNotificationsByRecent,
} from '@/services/notificationService';
import { computeReviewStats, normalizeReviewDoc } from '@/services/reviewService';
import { hasAnalyticsConsent } from '@/services/telemetryService';
import {
  computeRemainingSpots,
  normalizeDepartures,
  normalizeTripDoc,
} from '@/services/tripService';
import { CONSENT_STORAGE_KEY } from '@/types/consent';
import { filterAndSortTrips } from '@/utils/tripFilters';

describe('Items 3–8 Production Roadmap Suite', () => {
  it('decrements and restores spot inventory across primary and multi-departure turmas', () => {
    const rawTrip = {
      maxGuests: 12,
      availableSpots: 12,
      durationDays: 3,
      departures: [
        {
          id: 'dep-dec',
          startDate: '2026-12-15T08:00:00.000Z',
          endDate: '2026-12-18T08:00:00.000Z',
          maxGuests: 10,
          availableSpots: 6,
          priceOverride: 1590,
        },
      ],
    };

    const afterConfirm = applySpotDeltaToTrip(rawTrip, 4, -1, '2026-12-15T08:00:00.000Z');
    expect(afterConfirm.departures?.[0]?.availableSpots).toBe(2);
    expect(afterConfirm.availableSpots).toBe(8);

    // Overbooking attempt must throw
    expect(() =>
      applySpotDeltaToTrip(
        {
          ...rawTrip,
          departures: afterConfirm.departures,
          availableSpots: afterConfirm.availableSpots,
        },
        3,
        -1,
        '2026-12-15T08:00:00.000Z'
      )
    ).toThrow(/vagas suficientes/i);

    // Cancellation restores exact spots clamped to maxGuests
    const afterCancel = applySpotDeltaToTrip(
      {
        ...rawTrip,
        departures: afterConfirm.departures,
        availableSpots: afterConfirm.availableSpots,
      },
      4,
      1,
      '2026-12-15T08:00:00.000Z'
    );
    expect(afterCancel.departures?.[0]?.availableSpots).toBe(6);
    expect(afterCancel.availableSpots).toBe(12);
  });

  it('normalizes departures, coordinates, and filters multi-departure trips by month and capacity', () => {
    const departures = normalizeDepartures(
      [{ id: 'd1', startDate: '2027-02-10T08:00:00Z', maxGuests: 8, availableSpots: 5 }],
      16,
      4
    );
    expect(departures).toHaveLength(1);
    expect(departures[0].availableSpots).toBe(5);

    const trip = normalizeTripDoc('trip-live-1', {
      agencyId: 'ag-1',
      title: 'Expedição Jalapão',
      destination: 'Mateiros, TO',
      latitude: -10.5472,
      longitude: -46.4211,
      price: 2400,
      durationDays: 4,
      startDate: '2027-01-05T08:00:00Z',
      maxGuests: 10,
      availableSpots: 0,
      departures,
      isActive: true,
    });

    expect(trip.latitude).toBe(-10.5472);
    expect(trip.longitude).toBe(-46.4211);
    expect(computeRemainingSpots(trip)).toBe(0);
    expect(computeRemainingSpots(trip, '2027-02-10')).toBe(5);

    // Matches February via extra departure even though primary startDate is January, and has 5 spots on d1
    const febFiltered = filterAndSortTrips([trip], { month: '2027-02', travelers: 4 });
    expect(febFiltered).toHaveLength(1);

    const tooLargeGroup = filterAndSortTrips([trip], { month: '2027-02', travelers: 6 });
    expect(tooLargeGroup).toHaveLength(0);
  });

  it('normalizes verified reviews and computes aggregated ratings accurately', () => {
    const rev1 = normalizeReviewDoc('r1', {
      tripId: 't1',
      agencyId: 'a1',
      bookingId: 'bk-99',
      userUid: 'u1',
      userName: 'Marina',
      rating: 5,
      comment: 'Experiência impecável!',
    });
    const rev2 = normalizeReviewDoc('r2', {
      tripId: 't1',
      agencyId: 'a1',
      userUid: 'u2',
      userName: 'Carlos',
      rating: 4,
      comment: 'Roteiro muito bem organizado.',
    });

    expect(rev1.verifiedBooking).toBe(true);
    expect(rev1.bookingId).toBe('bk-99');
    expect(rev2.verifiedBooking).toBe(false);

    const stats = computeReviewStats([rev1, rev2]);
    expect(stats.totalReviews).toBe(2);
    expect(stats.rating).toBe(4.5);
  });

  it('normalizes and sorts in-app notifications newest first', () => {
    const n1 = normalizeNotificationDoc('n1', {
      recipientUid: 'u1',
      type: 'BOOKING_CREATED',
      title: 'Nova reserva',
      read: false,
      createdAt: '2026-11-17T10:00:00.000Z',
    });
    const n2 = normalizeNotificationDoc('n2', {
      recipientUid: 'u1',
      type: 'BOOKING_CONFIRMED',
      title: 'Reserva confirmada',
      read: true,
      createdAt: '2026-11-18T10:00:00.000Z',
    });

    const sorted = sortNotificationsByRecent([n1, n2]);
    expect(sorted[0].id).toBe('n2');
    expect(sorted[1].read).toBe(false);
  });

  it('enforces strict LGPD opt-in before enabling analytics telemetry', () => {
    const store = new Map<string, string>();
    const originalWindow = globalThis.window;
    const originalStorage = globalThis.localStorage;

    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
      configurable: true,
    });

    try {
      expect(hasAnalyticsConsent()).toBe(false);

      store.set(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          hasResponded: true,
          categories: { essential: true, analytics: false, marketing: false },
        })
      );
      expect(hasAnalyticsConsent()).toBe(false);

      store.set(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
          hasResponded: true,
          categories: { essential: true, analytics: true, marketing: false },
        })
      );
      expect(hasAnalyticsConsent()).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalStorage,
        configurable: true,
      });
    }
  });
});
