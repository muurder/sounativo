import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, db } from '@/services/firebase';
import { saveUserProfile, toggleFavoriteInFirestore } from '@/services/userService';
import { useAuth } from './useAuth';
import { UserProfile } from '@/types';

export function useUserProfile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [loading, setLoading] = useState<boolean>(Boolean(user));
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!db) {
      setProfile(user);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, COLLECTIONS.users, user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: user.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) });
        } else {
          setProfile(user);
        }
        setLoading(false);
      },
      () => {
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
      try {
        await saveUserProfile(user.uid, updates);
        await refreshProfile();
      } finally {
        setSaving(false);
      }
    },
    [refreshProfile, user?.uid]
  );

  const toggleFavorite = useCallback(
    async (tripId: string) => {
      if (!user?.uid) throw new Error('Faça login com Google para salvar favoritos.');
      const current = profile?.favorites ?? [];
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
    updateProfile,
    toggleFavorite,
  };
}
