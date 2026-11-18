import React, { createContext, useCallback, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/services/firebase';
import {
  consumeGoogleRedirectResult,
  loginWithEmail,
  loginWithGoogle,
  logoutFirebase,
  registerWithEmail,
  requestPasswordReset,
} from '@/services/authService';
import { ensureUserProfile, getUserProfile } from '@/services/userService';
import { useToast } from './ToastContext';
import { UserProfile, UserRole } from '@/types';

export interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  isFirebaseReady: boolean;
  clearAuthError: () => void;
  signInWithGoogle: (preferredRole?: Exclude<UserRole, 'ADMIN'>) => Promise<UserProfile>;
  signInWithEmail: (email: string, password: string) => Promise<UserProfile>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    role?: Exclude<UserRole, 'ADMIN'>
  ) => Promise<UserProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    const bootstrapAuth = async () => {
      try {
        const redirectProfile = await consumeGoogleRedirectResult();
        if (!cancelled && redirectProfile) {
          setUser(redirectProfile);
          setAuthError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Não foi possível concluir o login via Google.';
          setAuthError(message);
          showToast(message, 'error');
        }
      }

      if (cancelled) return;

      unsubscribe = onAuthStateChanged(
        firebaseAuth,
        async (fbUser) => {
          setFirebaseUser(fbUser);
          if (!fbUser) {
            setUser(null);
            setLoading(false);
            return;
          }

          try {
            const profile = await ensureUserProfile(fbUser);
            if (!cancelled) {
              setUser(profile);
              setAuthError(null);
            }
          } catch (err) {
            if (!cancelled) {
              const message =
                err instanceof Error ? err.message : 'Perfil carregado em modo de contingência.';
              setAuthError(message);
              setUser({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Viajante SouNativo',
                email: fbUser.email || '',
                photoURL: fbUser.photoURL || undefined,
                role: 'CLIENT',
                favorites: [],
                notificationsEnabled: true,
              });
            }
          } finally {
            if (!cancelled) setLoading(false);
          }
        },
        (listenerError) => {
          if (!cancelled) {
            setAuthError(listenerError.message || 'Falha ao monitorar estado de autenticação.');
            setLoading(false);
          }
        }
      );
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [showToast]);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser?.uid) return;
    try {
      const latest = await getUserProfile(firebaseUser.uid);
      if (latest) {
        setUser(latest);
        setAuthError(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dados da sessão.';
      setAuthError(message);
    }
  }, [firebaseUser]);

  const handleGoogleSignIn = useCallback(
    async (preferredRole: Exclude<UserRole, 'ADMIN'> = 'CLIENT') => {
      setAuthError(null);
      const profile = await loginWithGoogle(preferredRole);
      setUser(profile);
      return profile;
    },
    []
  );

  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
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
      setAuthError(null);
      const profile = await registerWithEmail(name, email, password, role);
      setUser(profile);
      return profile;
    },
    []
  );

  const handlePasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    await requestPasswordReset(email);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutFirebase();
      setUser(null);
      setFirebaseUser(null);
      setAuthError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao encerrar sessão.';
      setAuthError(message);
      showToast(message, 'error');
    }
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        authError,
        isFirebaseReady: isFirebaseConfigured,
        clearAuthError,
        signInWithGoogle: handleGoogleSignIn,
        signInWithEmail: handleEmailSignIn,
        signUpWithEmail: handleEmailSignUp,
        sendPasswordReset: handlePasswordReset,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
