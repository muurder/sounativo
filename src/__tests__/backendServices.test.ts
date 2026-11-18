import { describe, expect, it } from 'vitest';
import {
  isMissingIndexError,
  mapFirestoreError,
  stripUndefined,
  toIsoTimestamp,
} from '@/services/firebase';
import { normalizeAgencyDoc, sanitizeAgencySlug } from '@/services/agencyService';
import { normalizeTripDoc } from '@/services/tripService';
import { isSeedShowcaseTrip, normalizeBookingDoc } from '@/services/bookingService';
import { normalizeContactMessageDoc } from '@/services/contactService';
import { computeReviewStats, normalizeReviewDoc } from '@/services/reviewService';

describe('Backend Firestore Hygiene & Normalization (Phase 1)', () => {
  it('converts Firestore Timestamp-like objects and epoch seconds into ISO strings', () => {
    const fakeTimestamp = {
      seconds: 1763420000,
      nanoseconds: 0,
      toDate: () => new Date(1763420000 * 1000),
    };
    const iso = toIsoTimestamp(fakeTimestamp);
    expect(iso).toBe('2025-11-17T22:53:20.000Z');
    expect(toIsoTimestamp({ seconds: 1763420000, nanoseconds: 500_000_000 })).toBe(
      '2025-11-17T22:53:20.500Z'
    );
    expect(toIsoTimestamp(null, 'fallback-date')).toBe('fallback-date');
  });

  it('strips undefined fields recursively without corrupting arrays or primitives', () => {
    const raw = {
      name: 'Viajante',
      phone: undefined,
      nested: { a: 1, b: undefined },
      items: [{ x: 'ok', y: undefined }],
    };
    expect(stripUndefined(raw)).toEqual({
      name: 'Viajante',
      nested: { a: 1 },
      items: [{ x: 'ok' }],
    });
  });

  it('detects missing composite index errors accurately', () => {
    expect(isMissingIndexError({ code: 'failed-precondition' })).toBe(true);
    expect(isMissingIndexError({ message: 'The query requires an index.' })).toBe(true);
    expect(isMissingIndexError({ code: 'permission-denied' })).toBe(false);
  });

  it('maps Firebase error codes to localized resilient errors', () => {
    const err = mapFirestoreError({ code: 'permission-denied' }, 'Falha ao salvar.');
    expect(err.message).toContain('Permissão negada');
  });

  it('sanitizes agency slugs against underscores and reserved system routes', () => {
    expect(sanitizeAgencySlug('minha-agencia-_a1b', 'uid123')).toBe('minha-agencia-a1b');
    expect(sanitizeAgencySlug('dashboard', 'uid123')).toBe('dashboard-parceiro');
    expect(sanitizeAgencySlug('trips', 'uid123')).toBe('trips-parceiro');
  });

  it('normalizes malformed Firestore trip documents safely against white-screen crashes', () => {
    const trip = normalizeTripDoc('doc-1', {
      title: 'Chapada Real',
      agencyId: 'ag-1',
      price: '1490',
      durationDays: 4,
      startDate: { seconds: 1797580800, nanoseconds: 0 },
      tags: null,
      images: null,
      coverImage: 'https://images.unsplash.com/photo-1',
      isActive: true,
    });

    expect(trip.price).toBe(1490);
    expect(typeof trip.startDate).toBe('string');
    expect(trip.startDate.startsWith('2026-12')).toBe(true);
    expect(trip.images).toEqual(['https://images.unsplash.com/photo-1']);
    expect(trip.tags).toEqual([]);
    expect(trip.passengerConfig.allowChildren).toBe(true);
  });

  it('normalizes agency, booking, and review documents and computes live review stats', () => {
    const agency = normalizeAgencyDoc('ag-9', {
      ownerUid: 'u1',
      name: 'Nativa Eco',
      slug: 'nativa-eco',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(agency.logo).toBe('https://example.com/logo.png');
    expect(agency.languages).toEqual([]);

    const booking = normalizeBookingDoc('bk-1', {
      adults: 2,
      totalPrice: 2500,
      passengerDetails: null,
      cancellationReason: 'Condições climáticas severas',
    });
    expect(booking.passengerDetails).toEqual([]);
    expect(booking.voucherCode).toBe('SN-BK-1');
    expect(booking.cancellationReason).toBe('Condições climáticas severas');

    const lead = normalizeContactMessageDoc('msg-1', {
      name: 'Mariana',
      email: 'mariana@example.com',
      message: 'Quero orçamento para 12 pessoas.',
      source: 'GROUP_QUOTE',
      status: 'IN_PROGRESS',
    });
    expect(lead.source).toBe('GROUP_QUOTE');
    expect(lead.status).toBe('IN_PROGRESS');

    expect(isSeedShowcaseTrip('trip-chapada-01')).toBe(true);
    expect(isSeedShowcaseTrip('realFirestoreId99')).toBe(false);

    const rev1 = normalizeReviewDoc('r1', { rating: 5, comment: 'Excelente' });
    const rev2 = normalizeReviewDoc('r2', { rating: 4, comment: 'Muito bom' });
    expect(computeReviewStats([rev1, rev2])).toEqual({ rating: 4.5, totalReviews: 2 });
  });
});
