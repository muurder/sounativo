import { describe, expect, it } from 'vitest';
import {
  isPartnerRole,
  resolveDashboardViewMode,
} from '@/utils/dashboardRouting';
import {
  buildPartnerOrgName,
  buildPartnerSlug,
} from '@/services/partnerSignupService';

describe('Dashboard routing by account type (post-signup)', () => {
  it('lands AGENCY and GUIDE accounts on the partner panel instead of the traveler one', () => {
    expect(
      resolveDashboardViewMode({ requestedMode: null, role: 'AGENCY', isMasterAdmin: false })
    ).toBe('partner');
    expect(
      resolveDashboardViewMode({ requestedMode: null, role: 'GUIDE', isMasterAdmin: false })
    ).toBe('partner');
    expect(isPartnerRole('AGENCY')).toBe(true);
    expect(isPartnerRole('GUIDE')).toBe(true);
    expect(isPartnerRole('CLIENT')).toBe(false);
    expect(isPartnerRole(undefined)).toBe(false);
  });

  it('keeps traveler accounts on the traveler panel and honors explicit mode links', () => {
    expect(
      resolveDashboardViewMode({ requestedMode: null, role: 'CLIENT', isMasterAdmin: false })
    ).toBe('traveler');
    expect(
      resolveDashboardViewMode({ requestedMode: 'partner', role: 'CLIENT', isMasterAdmin: false })
    ).toBe('partner');
    expect(
      resolveDashboardViewMode({ requestedMode: 'traveler', role: 'AGENCY', isMasterAdmin: false })
    ).toBe('traveler');
    expect(
      resolveDashboardViewMode({ requestedMode: 'privacy', role: 'AGENCY', isMasterAdmin: false })
    ).toBe('privacy');
  });

  it('never exposes the admin panel to non-admin accounts', () => {
    expect(
      resolveDashboardViewMode({ requestedMode: 'admin', role: 'CLIENT', isMasterAdmin: false })
    ).toBe('traveler');
    expect(
      resolveDashboardViewMode({ requestedMode: 'admin', role: 'AGENCY', isMasterAdmin: false })
    ).toBe('partner');
    expect(
      resolveDashboardViewMode({ requestedMode: 'admin', role: 'ADMIN', isMasterAdmin: true })
    ).toBe('admin');
  });
});

describe('Partner provisioning during signup', () => {
  it('derives a usable organization name from the signup identity', () => {
    expect(buildPartnerOrgName({ name: 'Juan Galindo', email: 'juan@exemplo.com' })).toBe(
      'Juan Galindo'
    );
    expect(
      buildPartnerOrgName({ name: 'Viajante SouNativo', email: 'trilhas@exemplo.com' })
    ).toBe('trilhas');
    expect(buildPartnerOrgName({ name: 'Viajante SouNativo', email: 'a@b.com' })).toBe('');
    expect(
      buildPartnerOrgName({ name: 'Viajante', email: 'x@y.com' }, 'Agência Cerrado')
    ).toBe('Agência Cerrado');
  });

  it('builds a unique, uid-suffixed slug in the same shape as the onboarding form', () => {
    expect(buildPartnerSlug('Agência Cerrado Vivo', 'abc123xyz')).toBe(
      'agencia-cerrado-vivo-abc1'
    );
    expect(buildPartnerSlug('', 'abc123xyz')).toBe('parceiro-abc1');
    expect(buildPartnerSlug('!!!', 'uid_99')).toBe('parceiro-uid9');
  });
});
