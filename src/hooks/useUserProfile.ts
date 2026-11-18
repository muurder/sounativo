import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/services/firebase';
import {
  normalizeUserProfileDoc,
  saveUserProfile,
  toggleFavoriteInFirestore,
} from '@/services/userService';
import { useAuth } from './useAuth';
import { UserProfile } from '@/types';

export function useUserProfile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [loading, setLoading] = useState<boolean>(Boolean(user));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!db) {
      setProfile(user);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, COLLECTIONS.users, user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile(
            normalizeUserProfileDoc(user.uid, snap.data() as Record<string, unknown>, user.email)
          );
        } else {
          setProfile(user);
        }
        setError(null);
        setLoading(false);
      },
      (snapshotErr) => {
        setError(snapshotErr.message || 'Não foi possível sincronizar seu perfil em tempo real.');
        setProfile(user);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const updateProfile = useCallback(
    async (
      updates: Partial<
        Pick<
          UserProfile,
          | 'name'
          | 'phone'
          | 'cpf'
          | 'birthDate'
          | 'notificationsEnabled'
          | 'agencyId'
          | 'photoURL'
          | 'role'
        >
      >
    ) => {
      if (!user?.uid) throw new Error('Faça login para salvar seu perfil.');
      setSaving(true);
      setError(null);
      try {
        await saveUserProfile(user.uid, updates);
        await refreshProfile();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao salvar perfil.';
        setError(message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [refreshProfile, user?.uid]
  );

  const toggleFavorite = useCallback(
    async (tripId: string) => {
      if (!user?.uid) throw new Error('Faça login para salvar favoritos.');
      const current = Array.isArray(profile?.favorites) ? profile.favorites : [];
      const isFav = current.includes(tripId);
      await toggleFavoriteInFirestore(user.uid, tripId, isFav);
      return !isFav;
    },
    [profile?.favorites, user?.uid]
  );

  return {
    profile,
    loading,
    saving,
    error,
    updateProfile,
    toggleFavorite,
  };
}
