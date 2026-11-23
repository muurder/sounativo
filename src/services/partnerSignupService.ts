import { createAgencyInFirestore, fetchAgencyByOwner } from './agencyService';
import { saveUserProfile } from './userService';
import { slugify } from '@/utils/slugUtils';
import { Agency, UserProfile } from '@/types';

export type PartnerSignupRole = 'AGENCY' | 'GUIDE';

export interface ProvisionPartnerAccountInput {
  profile: UserProfile;
  isGuide: boolean;
  /** Optional hint (e.g. Google display name) used when the profile name is generic. */
  displayName?: string;
}

const GENERIC_PROFILE_NAMES = new Set(['viajante sounativo', 'viajante']);

/**
 * Derives the partner organization name from the signup identity.
 * Returns an empty string when there is nothing usable to name the microsite.
 */
export function buildPartnerOrgName(
  profile: Pick<UserProfile, 'name' | 'email'>,
  displayName?: string
): string {
  const candidates = [displayName, profile.name, profile.email?.split('@')[0]];
  for (const candidate of candidates) {
    const clean = (candidate ?? '').trim();
    if (clean.length < 2) continue;
    if (GENERIC_PROFILE_NAMES.has(clean.toLowerCase())) continue;
    return clean.slice(0, 120);
  }
  return '';
}

export function buildPartnerSlug(orgName: string, uid: string): string {
  const suffix =
    uid
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toLowerCase() || 'br';
  const base = slugify(orgName).slice(0, 80);
  return base ? `${base}-${suffix}` : `parceiro-${suffix}`;
}

/**
 * Creates the agency/guide microsite as part of the partner signup itself, so the
 * account lands on the partner dashboard instead of an empty activation screen.
 *
 * Best-effort by design: a failure here must never block account creation, so the
 * caller can still render the onboarding form as a fallback.
 */
export async function provisionPartnerAccount({
  profile,
  isGuide,
  displayName,
}: ProvisionPartnerAccountInput): Promise<Agency | null> {
  if (!profile.uid) return null;
  // Only accounts whose signup chose a partner role are provisioned; an existing
  // traveler account must never be silently converted into an agency.
  if (profile.role !== 'AGENCY' && profile.role !== 'GUIDE') return null;

  const orgName = buildPartnerOrgName(profile, displayName);
  if (!orgName) return null;

  try {
    const existing = await fetchAgencyByOwner(profile.uid);
    const agency =
      existing ??
      (await createAgencyInFirestore({
        ownerUid: profile.uid,
        name: orgName,
        slug: buildPartnerSlug(orgName, profile.uid),
        description: isGuide
          ? 'Guia local credenciado pelo SouNativo.'
          : 'Agência parceira curada pelo SouNativo.',
        logo: profile.photoURL ?? '',
        whatsapp: profile.phone ?? '',
        city: '',
        state: 'BR',
        isGuide,
        cadastur: '',
        heroMode: 'TRIPS',
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      }));

    await saveUserProfile(profile.uid, {
      agencyId: agency.id,
      role: isGuide ? 'GUIDE' : 'AGENCY',
    });

    return agency;
  } catch (err) {
    console.warn('[provisionPartnerAccount] Onboarding automático indisponível:', err);
    return null;
  }
}
