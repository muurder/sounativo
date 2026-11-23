import { describe, expect, it } from 'vitest';
import { SEED_TRIPS } from '@/services/seedCatalog';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { mapFirebaseAuthError } from '@/services/authService';

describe('whatsapp and auth error helpers', () => {
  it('builds encoded WhatsApp URL pointing to /viagem/:slug', () => {
    const url = buildWhatsAppLink('(45) 99999-1111', SEED_TRIPS[0], 'https://sounativo.vercel.app');
    expect(url).toContain('https://wa.me/45999991111?text=');
    expect(decodeURIComponent(url!)).toContain(`/viagem/${SEED_TRIPS[0].slug}`);
  });

  it('returns null when WhatsApp number is empty or invalid', () => {
    expect(buildWhatsAppLink('', SEED_TRIPS[0])).toBeNull();
    expect(buildWhatsAppLink(undefined, SEED_TRIPS[0])).toBeNull();
  });

  it('maps common Firebase Auth codes to clear pt-BR messages', () => {
    expect(mapFirebaseAuthError('auth/invalid-credential')).toBe('E-mail ou senha inválidos.');
    expect(mapFirebaseAuthError('auth/invalid-email')).toBe(
      'Informe um endereço de e-mail válido.'
    );
    expect(mapFirebaseAuthError('auth/internal-error')).toContain('Erro interno');
    expect(mapFirebaseAuthError('auth/operation-not-supported-in-this-environment')).toContain(
      'não suporta popup'
    );
    expect(mapFirebaseAuthError('auth/web-storage-unsupported')).toContain('cookies');
    expect(mapFirebaseAuthError('auth/password-does-not-meet-requirements')).toContain(
      'requisitos mínimos'
    );
    expect(mapFirebaseAuthError('auth/unknown-code')).toContain('Verifique sua conexão');
  });
});
