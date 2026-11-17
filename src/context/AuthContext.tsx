import React, { createContext, useCallback, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/services/firebase';
import {
  loginWithEmail,
  loginWithGoogle,
  logoutFirebase,
  registerWithEmail,
} from '@/services/authService';
import { ensureUserProfile, getUserProfile } from '@/services/userService';
import { UserProfile, UserRole } from '@/types';

export interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: (preferredRole?: Exclude<UserRole, 'ADMIN'>) => Promise<UserProfile>;
  signInWithEmail: (email: string, password: string) => Promise<UserProfile>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    role?: Exclude<UserRole, 'ADMIN'>
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await ensureUserProfile(fbUser);
        setUser(profile);
      } catch {
        setUser({
          uid: fbUser.uid,
          name: fbUser.displayName || 'Viajante',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || undefined,
          role: 'CLIENT',
          favorites: [],
          notificationsEnabled: true,
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const latest = await getUserProfile(firebaseUser.uid);
    if (latest) setUser(latest);
  }, [firebaseUser]);

  const handleGoogleSignIn = useCallback(
    async (preferredRole: Exclude<UserRole, 'ADMIN'> = 'CLIENT') => {
      const profile = await loginWithGoogle(preferredRole);
      setUser(profile);
      return profile;
    },
    []
  );

  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    const profile = await loginWithEmail(email, password);
    setUser(profile);
    return profile;
  }, []);

  const handleEmailSignUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: Exclude<UserRole, 'ADMIN'> = 'CLIENT'
    ) => {
      const profile = await registerWithEmail(name, email, password, role);
      setUser(profile);
      return profile;
    },
    []
  );

  const handleLogout = useCallback(async () => {
    await logoutFirebase();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isFirebaseReady: isFirebaseConfigured,
        signInWithGoogle: handleGoogleSignIn,
        signInWithEmail: handleEmailSignIn,
        signUpWithEmail: handleEmailSignUp,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
