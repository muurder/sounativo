import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { SEED_AGENCIES } from './seedCatalog';
import { Agency, AgencyTheme } from '@/types';

export async function fetchAllAgencies(guidesOnly?: boolean): Promise<Agency[]> {
  let agencies = SEED_AGENCIES;

  if (db) {
    try {
      const q = query(
        collection(db, COLLECTIONS.agencies),
        where('isActive', '==', true),
        limit(50)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const live = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Agency, 'id'>) }));
        const liveSlugs = new Set(live.map((a) => a.slug));
        agencies = [...live, ...SEED_AGENCIES.filter((a) => !liveSlugs.has(a.slug))];
      }
    } catch {
      // Fallback to seed catalog
    }
  }

  if (guidesOnly === true) return agencies.filter((a) => a.isGuide);
  if (guidesOnly === false) return agencies.filter((a) => !a.isGuide);
  return agencies;
}

export async function fetchAgencyBySlug(slug: string): Promise<Agency | null> {
  if (db) {
    try {
      const q = query(collection(db, COLLECTIONS.agencies), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...(d.data() as Omit<Agency, 'id'>) };
      }
    } catch {
      // Fallback
    }
  }
  return SEED_AGENCIES.find((a) => a.slug === slug) ?? null;
}

export async function fetchAgencyByOwner(ownerUid: string): Promise<Agency | null> {
  if (!db) return null;
  const q = query(
    collection(db, COLLECTIONS.agencies),
    where('ownerUid', '==', ownerUid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Agency, 'id'>) };
}

export async function createAgencyInFirestore(
  payload: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Agency> {
  if (!db) throw new Error('Firestore não configurado.');
  const sanitized = {
    ownerUid: payload.ownerUid,
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    logo: payload.logo,
    whatsapp: payload.whatsapp ?? '',
    city: payload.city ?? '',
    state: payload.state ?? '',
    isGuide: payload.isGuide,
    cadastur: payload.cadastur ?? '',
    languages: payload.languages ?? ['Português'],
    specialties: payload.specialties ?? [],
    ...(payload.availability ? { availability: payload.availability } : {}),
    heroMode: payload.heroMode,
    subscriptionPlan: 'STARTER' as const,
    subscriptionStatus: 'ACTIVE' as const,
    isActive: true,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.agencies), {
    ...sanitized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...sanitized };
}

export type EditableAgencyFields = Partial<
  Pick<
    Agency,
    | 'name'
    | 'description'
    | 'whatsapp'
    | 'city'
    | 'state'
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
  const cleaned = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
    ...cleaned,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAgencyThemeInFirestore(
  agencyId: string,
  theme: AgencyTheme
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
    theme,
    updatedAt: serverTimestamp(),
  });
}
