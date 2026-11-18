import { describe, expect, it } from 'vitest';
import { exportUserData } from '@/services/privacyService';

describe('exportUserData (LGPD Art. 18 / GDPR Art. 15 e 20)', () => {
  it('generates valid export package structure with metadata', async () => {
    const data = await exportUserData('test-uid-123', 'viajante@sounativo.com');

    expect(data.metadata).toBeDefined();
    expect(data.metadata.userUid).toBe('test-uid-123');
    expect(data.metadata.userEmail).toBe('viajante@sounativo.com');
    expect(data.metadata.platform).toContain('SouNativo');
    expect(data.metadata.legalNotice).toContain('Lei nº 13.709/2018');
    expect(Array.isArray(data.bookings)).toBe(true);
    expect(Array.isArray(data.reviews)).toBe(true);
    expect(Array.isArray(data.consentHistory)).toBe(true);
  });
});
