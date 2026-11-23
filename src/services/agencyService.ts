import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  db,
  isMissingIndexError,
  mapFirestoreError,
  serverTimestamp,
  stripUndefined,
  toIsoTimestamp,
} from './firebase';
import { SEED_AGENCIES } from './seedCatalog';
import { slugify } from '@/utils/slugUtils';
import { Agency, AgencyTheme, PlanTier, SubscriptionStatus } from '@/types';

export const RESERVED_AGENCY_SLUGS = new Set([
  'trips',
  'viagem',
  'agencies',
  'guides',
  'dashboard',
  'about',
  'contact',
  'terms',
  'termos',
  'privacy',
  'politica-de-privacidade',
  'cookies',
  'politica-de-cookies',
  'minha-privacidade',
  'privacy-settings',
  'client',
  'agency',
  'guide',
  'admin',
  'settings',
  'login',
  'entrar',
  'signup',
  'cadastro',
  'cadastrar',
  'criar-conta',
  'registro',
  'register',
  'api',
  'auth',
]);

const DEFAULT_AGENCY_LOGO =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80';

const VALID_PLANS = new Set<PlanTier>(['STARTER', 'BASIC', 'PREMIUM']);
const VALID_SUB_STATUSES = new Set<SubscriptionStatus>(['ACTIVE', 'INACTIVE', 'PENDING']);

export function sanitizeAgencySlug(rawSlug: string, fallbackSeed = 'parceiro'): string {
  const clean = slugify(rawSlug.replace(/_/g, '-'))
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  if (clean.length >= 2 && !RESERVED_AGENCY_SLUGS.has(clean)) {
    return clean;
  }
  const suffix = slugify(fallbackSeed.replace(/_/g, '')).slice(0, 6) || 'br';
  const base = clean.length >= 2 ? `${clean}-parceiro` : `parceiro-${suffix}`;
  return base.slice(0, 96);
}

export function normalizeAgencyDoc(id: string, raw: Record<string, unknown>): Agency {
  const planCandidate = raw.subscriptionPlan as PlanTier | undefined;
  const statusCandidate = raw.subscriptionStatus as SubscriptionStatus | undefined;
  const languages = Array.isArray(raw.languages)
    ? raw.languages.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const specialties = Array.isArray(raw.specialties)
    ? raw.specialties.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const createdAt = toIsoTimestamp(raw.createdAt);
  const updatedAt = toIsoTimestamp(raw.updatedAt);
  const rawLogo =
    (typeof raw.logo === 'string' && raw.logo) ||
    (typeof raw.logoUrl === 'string' && raw.logoUrl) ||
    (typeof raw.logoURL === 'string' && raw.logoURL) ||
    DEFAULT_AGENCY_LOGO;

  return {
    id,
    ownerUid: typeof raw.ownerUid === 'string' ? raw.ownerUid : '',
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Parceiro SouNativo',
    slug: typeof raw.slug === 'string' ? raw.slug : id,
    description: typeof raw.description === 'string' ? raw.description : '',
    logo: rawLogo,
    ...(typeof raw.email === 'string' ? { email: raw.email } : {}),
    ...(typeof raw.phone === 'string' ? { phone: raw.phone } : {}),
    ...(typeof raw.whatsapp === 'string' ? { whatsapp: raw.whatsapp } : {}),
    ...(typeof raw.website === 'string' ? { website: raw.website } : {}),
    ...(typeof raw.city === 'string' ? { city: raw.city } : {}),
    ...(typeof raw.state === 'string' ? { state: raw.state } : {}),
    isGuide: Boolean(raw.isGuide || raw.type === 'GUIDE'),
    verified: Boolean(raw.verified || raw.isVerified),
    ...(typeof raw.cnpj === 'string' && raw.cnpj ? { cnpj: raw.cnpj } : {}),
    ...(typeof raw.cadastur === 'string' ? { cadastur: raw.cadastur } : {}),
    languages,
    specialties,
    ...(typeof raw.experienceYears === 'number' && Number.isFinite(raw.experienceYears)
      ? { experienceYears: raw.experienceYears }
      : {}),
    ...(raw.availability === 'FULL_TIME' ||
    raw.availability === 'PART_TIME' ||
    raw.availability === 'ON_DEMAND'
      ? { availability: raw.availability }
      : {}),
    heroMode: raw.heroMode === 'STATIC' ? 'STATIC' : 'TRIPS',
    ...(typeof raw.heroBannerUrl === 'string' ? { heroBannerUrl: raw.heroBannerUrl } : {}),
    ...(typeof raw.heroTitle === 'string' ? { heroTitle: raw.heroTitle } : {}),
    ...(typeof raw.heroSubtitle === 'string' ? { heroSubtitle: raw.heroSubtitle } : {}),
    subscriptionPlan: planCandidate && VALID_PLANS.has(planCandidate) ? planCandidate : 'STARTER',
    ...(typeof raw.requestedPlan === 'string' && VALID_PLANS.has(raw.requestedPlan as PlanTier)
      ? { requestedPlan: raw.requestedPlan as PlanTier }
      : {}),
    subscriptionStatus:
      statusCandidate && VALID_SUB_STATUSES.has(statusCandidate) ? statusCandidate : 'ACTIVE',
    ...(raw.theme && typeof raw.theme === 'object' ? { theme: raw.theme as AgencyTheme } : {}),
    isActive: raw.isActive !== false,
    ...(typeof raw.rating === 'number' && Number.isFinite(raw.rating)
      ? { rating: raw.rating }
      : {}),
    ...(typeof raw.totalReviews === 'number' && Number.isFinite(raw.totalReviews)
      ? { totalReviews: raw.totalReviews }
      : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export async function fetchAllAgencies(guidesOnly?: boolean): Promise<Agency[]> {
  let agencies = SEED_AGENCIES;

  if (db) {
    const firestoreDb = db;
    try {
      const q =
        guidesOnly !== undefined
          ? query(
              collection(firestoreDb, COLLECTIONS.agencies),
              where('isActive', '==', true),
              where('isGuide', '==', guidesOnly),
              limit(50)
            )
          : query(
              collection(firestoreDb, COLLECTIONS.agencies),
              where('isActive', '==', true),
              limit(50)
            );
      let snap;
      try {
        snap = await getDocs(q);
      } catch (queryErr: unknown) {
        if (guidesOnly !== undefined && isMissingIndexError(queryErr)) {
          snap = await getDocs(
            query(
              collection(firestoreDb, COLLECTIONS.agencies),
              where('isActive', '==', true),
              limit(50)
            )
          );
        } else {
          throw queryErr;
        }
      }
      if (!snap.empty) {
        const live = snap.docs.map((d) =>
          normalizeAgencyDoc(d.id, d.data() as Record<string, unknown>)
        );
        const liveSlugs = new Set(live.map((a) => a.slug));
        agencies = [...live, ...SEED_AGENCIES.filter((a) => !liveSlugs.has(a.slug))];
      }
    } catch (err) {
      console.warn('[agencyService.fetchAllAgencies] Usando catálogo curado de contingência:', err);
    }
  }

  if (guidesOnly === true) return agencies.filter((a) => a.isGuide);
  if (guidesOnly === false) return agencies.filter((a) => !a.isGuide);
  return agencies;
}

export async function fetchAgencyBySlug(slug: string): Promise<Agency | null> {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  if (db) {
    try {
      const q = query(
        collection(db, COLLECTIONS.agencies),
        where('slug', '==', cleanSlug),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const normalized = normalizeAgencyDoc(d.id, d.data() as Record<string, unknown>);
        if (normalized.isActive !== false) {
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[agencyService.fetchAgencyBySlug] Fallback para catálogo local:', err);
    }
  }
  return SEED_AGENCIES.find((a) => a.slug === cleanSlug) ?? null;
}

export async function fetchAgencyByOwner(ownerUid: string): Promise<Agency | null> {
  if (!db || !ownerUid) return null;
  try {
    const q = query(
      collection(db, COLLECTIONS.agencies),
      where('ownerUid', '==', ownerUid),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return normalizeAgencyDoc(d.id, d.data() as Record<string, unknown>);
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao consultar microsite do parceiro.');
  }
}

async function resolveUniqueAgencySlug(desiredSlug: string, ownerUid: string): Promise<string> {
  let candidate = sanitizeAgencySlug(desiredSlug, ownerUid);
  const seedSlugs = new Set(SEED_AGENCIES.map((a) => a.slug));

  if (!db) return candidate;

  for (let attempt = 0; attempt < 4; attempt++) {
    const checkSlug =
      attempt === 0
        ? candidate
        : `${candidate.slice(0, 88)}-${Math.random().toString(36).slice(2, 6)}`;
    if (seedSlugs.has(checkSlug) || RESERVED_AGENCY_SLUGS.has(checkSlug)) {
      continue;
    }
    const existing = await getDocs(
      query(collection(db, COLLECTIONS.agencies), where('slug', '==', checkSlug), limit(1))
    );
    if (existing.empty) {
      return checkSlug;
    }
  }

  return `${candidate.slice(0, 86)}-${Date.now().toString(36).slice(-6)}`;
}

export async function createAgencyInFirestore(
  payload: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Agency> {
  if (!db) throw new Error('Firestore não configurado.');

  const cleanName = payload.name.trim().slice(0, 120);
  if (cleanName.length < 2) {
    throw new Error('O nome da agência ou guia deve ter pelo menos 2 caracteres.');
  }

  // Idempotency guard: prevent duplicate orphan microsites on double-click or retry
  const existingByOwner = await fetchAgencyByOwner(payload.ownerUid);
  if (existingByOwner) {
    return existingByOwner;
  }

  const uniqueSlug = await resolveUniqueAgencySlug(payload.slug || cleanName, payload.ownerUid);
  const safeLogo =
    payload.logo && /^https?:\/\//i.test(payload.logo)
      ? payload.logo.slice(0, 2048)
      : DEFAULT_AGENCY_LOGO;

  const cleanEmail = (payload.email ?? '').trim().toLowerCase().slice(0, 254);
  const cleanCnpj = (payload.cnpj ?? '').trim().slice(0, 25);

  const sanitized = {
    ownerUid: payload.ownerUid,
    name: cleanName,
    slug: uniqueSlug,
    description: (payload.description ?? '').trim().slice(0, 5000),
    logo: safeLogo,
    ...(cleanEmail ? { email: cleanEmail } : {}),
    ...(cleanCnpj ? { cnpj: cleanCnpj } : {}),
    whatsapp: (payload.whatsapp ?? '').trim().slice(0, 30),
    city: (payload.city ?? '').trim().slice(0, 100),
    state: (payload.state ?? 'BR').trim().slice(0, 50),
    isGuide: Boolean(payload.isGuide),
    cadastur: (payload.cadastur ?? '').trim().slice(0, 50),
    languages: (payload.languages ?? ['Português']).slice(0, 20),
    specialties: (payload.specialties ?? []).slice(0, 20),
    ...(payload.availability ? { availability: payload.availability } : {}),
    heroMode: payload.heroMode === 'STATIC' ? ('STATIC' as const) : ('TRIPS' as const),
    subscriptionPlan: 'STARTER' as const,
    subscriptionStatus: 'ACTIVE' as const,
    isActive: true,
  };

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.agencies), {
      ...stripUndefined(sanitized as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      ...sanitized,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Não foi possível criar seu microsite no Firestore.');
  }
}

export type EditableAgencyFields = Partial<
  Pick<
    Agency,
    | 'name'
    | 'description'
    | 'whatsapp'
    | 'phone'
    | 'email'
    | 'website'
    | 'city'
    | 'state'
    | 'cnpj'
    | 'cadastur'
    | 'languages'
    | 'specialties'
    | 'experienceYears'
    | 'availability'
    | 'heroMode'
    | 'heroTitle'
    | 'heroSubtitle'
    | 'heroBannerUrl'
    | 'logo'
  >
>;

export async function updateAgencyProfileInFirestore(
  agencyId: string,
  updates: EditableAgencyFields
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!agencyId) throw new Error('Identificador da agência inválido.');

  const sanitized: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    const cleanName = updates.name.trim().slice(0, 120);
    if (cleanName.length < 2) {
      throw new Error('O nome de exibição deve ter pelo menos 2 caracteres.');
    }
    sanitized.name = cleanName;
  }
  if (updates.description !== undefined) {
    sanitized.description = updates.description.trim().slice(0, 5000);
  }
  if (updates.whatsapp !== undefined) {
    sanitized.whatsapp = updates.whatsapp.trim().slice(0, 30);
  }
  if (updates.phone !== undefined) {
    sanitized.phone = updates.phone.trim().slice(0, 30);
  }
  if (updates.email !== undefined) {
    sanitized.email = updates.email.trim().toLowerCase().slice(0, 254);
  }
  if (updates.website !== undefined) {
    const cleanWeb = updates.website.trim();
    if (cleanWeb && !/^https?:\/\//i.test(cleanWeb)) {
      throw new Error('O site oficial deve iniciar com http:// ou https://.');
    }
    sanitized.website = cleanWeb.slice(0, 500);
  }
  if (updates.city !== undefined) {
    sanitized.city = updates.city.trim().slice(0, 100);
  }
  if (updates.state !== undefined) {
    sanitized.state = updates.state.trim().slice(0, 50);
  }
  if (updates.cnpj !== undefined) {
    sanitized.cnpj = updates.cnpj.trim().slice(0, 25);
  }
  if (updates.cadastur !== undefined) {
    sanitized.cadastur = updates.cadastur.trim().slice(0, 50);
  }
  if (updates.languages !== undefined) {
    sanitized.languages = updates.languages
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (updates.specialties !== undefined) {
    sanitized.specialties = updates.specialties
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
  if (updates.experienceYears !== undefined) {
    const years = Number(updates.experienceYears);
    sanitized.experienceYears = Number.isFinite(years) ? Math.min(100, Math.max(0, years)) : 0;
  }
  if (updates.availability !== undefined) {
    sanitized.availability = updates.availability;
  }
  if (updates.heroMode !== undefined) {
    sanitized.heroMode = updates.heroMode;
  }
  if (updates.heroTitle !== undefined) {
    sanitized.heroTitle = updates.heroTitle.trim().slice(0, 150);
  }
  if (updates.heroSubtitle !== undefined) {
    sanitized.heroSubtitle = updates.heroSubtitle.trim().slice(0, 300);
  }
  if (updates.heroBannerUrl !== undefined) {
    const cleanBanner = updates.heroBannerUrl.trim();
    if (cleanBanner && !/^https?:\/\//i.test(cleanBanner)) {
      throw new Error('A imagem de capa deve usar uma URL válida (http/https).');
    }
    sanitized.heroBannerUrl = cleanBanner.slice(0, 2048);
  }
  if (updates.logo !== undefined) {
    const cleanLogo = updates.logo.trim();
    if (cleanLogo && !/^https?:\/\//i.test(cleanLogo)) {
      throw new Error('A logo deve usar uma URL válida (http/https).');
    }
    sanitized.logo = cleanLogo.slice(0, 2048);
  }

  try {
    await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
      ...stripUndefined(sanitized),
      updatedAt: serverTimestamp(),
    });

    // Propagate updated agencyName to owned trips to prevent denormalization drift
    if (typeof sanitized.name === 'string') {
      try {
        const ownedTripsSnap = await getDocs(
          query(collection(db, COLLECTIONS.trips), where('agencyId', '==', agencyId), limit(100))
        );
        if (!ownedTripsSnap.empty) {
          const batch = writeBatch(db);
          ownedTripsSnap.docs.forEach((tripDoc) => {
            batch.update(tripDoc.ref, {
              agencyName: sanitized.name,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } catch {
        // Non-fatal denormalization sync
      }
    }
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao atualizar dados públicos da agência.');
  }
}

export async function updateAgencyThemeInFirestore(
  agencyId: string,
  theme: AgencyTheme
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  try {
    await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
      theme: stripUndefined(theme as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Erro ao salvar identidade visual do microsite.');
  }
}

export async function requestAgencyPlanUpgradeInFirestore(
  agencyId: string,
  targetPlan: PlanTier
): Promise<{
  subscriptionPlan?: PlanTier;
  requestedPlan?: PlanTier;
  subscriptionStatus: SubscriptionStatus;
}> {
  if (!db) throw new Error('Firestore não configurado.');
  if (!VALID_PLANS.has(targetPlan)) {
    throw new Error('Plano selecionado inválido.');
  }

  const nextStatus: SubscriptionStatus = targetPlan === 'STARTER' ? 'ACTIVE' : 'PENDING';
  try {
    if (targetPlan === 'STARTER') {
      await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
        subscriptionPlan: 'STARTER',
        requestedPlan: null,
        subscriptionStatus: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
      return { subscriptionPlan: 'STARTER', requestedPlan: undefined, subscriptionStatus: 'ACTIVE' };
    }

    await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
      requestedPlan: targetPlan,
      subscriptionStatus: 'PENDING',
      updatedAt: serverTimestamp(),
    });
    return { requestedPlan: targetPlan, subscriptionStatus: nextStatus };
  } catch (err: unknown) {
    throw mapFirestoreError(err, 'Não foi possível registrar a solicitação de plano.');
  }
}
