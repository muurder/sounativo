import { UserRole } from '@/types';

export type DashboardViewMode = 'traveler' | 'partner' | 'admin' | 'privacy';

export function isPartnerRole(role?: UserRole | null): boolean {
  return role === 'AGENCY' || role === 'GUIDE';
}

export function formatUserRoleLabel(role?: UserRole | null): string {
  switch (role) {
    case 'GUIDE':
      return 'Guia de Turismo';
    case 'AGENCY':
      return 'Agência de Turismo';
    case 'ADMIN':
      return 'Administrador';
    case 'CLIENT':
    default:
      return 'Viajante';
  }
}

/**
 * Resolves which dashboard the account should see by default.
 *
 * The account type chosen at signup is authoritative:
 * - ADMIN (with master admin authority) -> admin console
 * - AGENCY / GUIDE -> partner panel (Agency or Guide workspace)
 * - CLIENT -> traveler panel
 * Explicit `?mode=` links still work when deep-linking to privacy or admin.
 */
export function resolveDashboardViewMode(input: {
  requestedMode: string | null;
  role?: UserRole | null;
  isMasterAdmin: boolean;
}): DashboardViewMode {
  const { requestedMode, role, isMasterAdmin } = input;

  if (requestedMode === 'privacy') return 'privacy';
  if (requestedMode === 'admin') {
    if (isMasterAdmin) return 'admin';
    return isPartnerRole(role) ? 'partner' : 'traveler';
  }
  if (requestedMode === 'partner') return 'partner';
  if (requestedMode === 'traveler') return 'traveler';

  if (role === 'ADMIN' && isMasterAdmin) return 'admin';
  return isPartnerRole(role) ? 'partner' : 'traveler';
}
