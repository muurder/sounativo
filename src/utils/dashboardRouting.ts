import { UserRole } from '@/types';

export type DashboardViewMode = 'traveler' | 'partner' | 'admin' | 'privacy';

export function isPartnerRole(role?: UserRole | null): boolean {
  return role === 'AGENCY' || role === 'GUIDE';
}

/**
 * Resolves which dashboard the account should see by default.
 *
 * The account type chosen at signup is authoritative: AGENCY/GUIDE accounts land
 * on the partner panel instead of the traveler panel. Explicit `?mode=` links
 * still win, and the admin panel never renders for non-admin accounts.
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

  return isPartnerRole(role) ? 'partner' : 'traveler';
}
