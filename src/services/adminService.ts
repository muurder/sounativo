import { collection, doc, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { COLLECTIONS, db, serverTimestamp } from './firebase';
import { Agency, PlanTier, Trip, UserProfile, UserRole } from '@/types';

export interface AdminManagedUser extends UserProfile {
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminManagedAgency extends Agency {
  verified?: boolean;
}

export async function fetchAllUsersForAdmin(): Promise<AdminManagedUser[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COLLECTIONS.users), limit(50)));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AdminManagedUser, 'uid'>) }));
}

export async function updateUserRoleAsAdmin(
  uid: string,
  role: UserRole,
  status?: 'ACTIVE' | 'SUSPENDED'
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.users, uid), {
    role,
    ...(status ? { status } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchAllAgenciesForAdmin(): Promise<AdminManagedAgency[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COLLECTIONS.agencies), limit(50)));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<AdminManagedAgency, 'id'>),
  }));
}

export async function updateAgencyAdminControls(
  agencyId: string,
  updates: { verified?: boolean; isActive?: boolean; subscriptionPlan?: PlanTier }
): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.agencies, agencyId), {
    ...updates,
    ...(updates.subscriptionPlan ? { subscriptionStatus: 'ACTIVE' } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function fetchAllTripsForAdmin(): Promise<Trip[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, COLLECTIONS.trips), limit(50)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Trip, 'id'>) }));
}

export async function toggleTripFeaturedAsAdmin(tripId: string, featured: boolean): Promise<void> {
  if (!db) throw new Error('Firestore não configurado.');
  await updateDoc(doc(db, COLLECTIONS.trips, tripId), {
    featured,
    updatedAt: serverTimestamp(),
  });
}
