import { describe, expect, it } from 'vitest';
import {
  normalizeContactMessageDoc,
  submitContactMessageInFirestore,
} from '@/services/contactService';
import { deleteUserAccountPermanently } from '@/services/privacyService';
import { createBookingInFirestore, isSeedShowcaseTrip } from '@/services/bookingService';
import { computeReviewStats, createReviewInFirestore } from '@/services/reviewService';
import { RESERVED_AGENCY_SLUGS, sanitizeAgencySlug } from '@/services/agencyService';

describe('Phase 3 — Surgical Flow Validation Suite', () => {
  it('validates contact and group quote inputs strictly before hitting Firestore', async () => {
    await expect(
      submitContactMessageInFirestore({
        name: 'A',
        email: 'cliente@exemplo.com',
        message: 'Gostaria de cotar pacote.',
      })
    ).rejects.toThrow(/mínimo de 2 caracteres/i);

    await expect(
      submitContactMessageInFirestore({
        name: 'Maria Silva',
        email: 'email-invalido',
        message: 'Gostaria de cotar pacote.',
      })
    ).rejects.toThrow(/e-mail válido/i);

    await expect(
      submitContactMessageInFirestore({
        name: 'Maria Silva',
        email: 'maria@exemplo.com',
        message: 'Oi',
      })
    ).rejects.toThrow(/5 caracteres/i);
  });

  it('normalizes contact message records with Firestore Timestamps and statuses', () => {
    const normalized = normalizeContactMessageDoc('msg-01', {
      name: '  Grupo Corporativo  ',
      email: 'rh@empresa.com.br',
      message: 'Cotação para 18 pessoas na Chapada',
      source: 'GROUP_QUOTE',
      status: 'IN_PROGRESS',
      createdAt: { seconds: 1763420000, nanoseconds: 0 },
    });

    expect(normalized.name).toBe('Grupo Corporativo');
    expect(normalized.source).toBe('GROUP_QUOTE');
    expect(normalized.status).toBe('IN_PROGRESS');
    expect(normalized.createdAt).toBe('2025-11-17T22:53:20.000Z');
  });

  it('blocks LGPD permanent deletion immediately when session is unauthenticated or mismatched', async () => {
    await expect(deleteUserAccountPermanently('non-matching-uid')).rejects.toThrow(
      /Sessão inválida/i
    );
  });

  it('intercepts showcase demo trips on booking and review flows with accurate guidance', async () => {
    expect(isSeedShowcaseTrip('trip-lencois-01')).toBe(true);

    await expect(
      createBookingInFirestore({
        tripId: 'trip-lencois-01',
        tripTitle: 'Lençóis Maranhenses',
        tripSlug: 'lencois-maranhenses',
        tripImage: 'https://images.unsplash.com/photo-1',
        agencyId: 'ag-seed-1',
        agencyName: 'Agência Seed',
        clientUid: 'uid-1',
        clientName: 'Cliente',
        clientEmail: 'cliente@teste.com',
        adults: 2,
        children: 0,
        totalPrice: 3200,
        status: 'PENDING',
        paymentMethod: 'PIX',
        voucherCode: 'SN-TEST01',
        passengerDetails: [{ name: 'Cliente', type: 'adult' }],
      })
    ).rejects.toThrow(/vitrine ilustrativa|Conecte o Firebase/i);

    await expect(
      createReviewInFirestore({
        tripId: 'trip-lencois-01',
        agencyId: 'ag-seed-1',
        userUid: 'uid-1',
        userName: 'Cliente',
        rating: 5,
        comment: 'Passeio incrível!',
      })
    ).rejects.toThrow(/vitrine ilustrativa|Conecte o Firebase/i);
  });

  it('protects system routes against agency slug collisions and computes live ratings', () => {
    for (const reserved of ['trips', 'dashboard', 'admin', 'guides', 'agencies', 'contact']) {
      expect(RESERVED_AGENCY_SLUGS.has(reserved)).toBe(true);
      expect(sanitizeAgencySlug(reserved, 'u99')).not.toBe(reserved);
    }

    expect(computeReviewStats([])).toEqual({ rating: 0, totalReviews: 0 });
  });
});
