import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/services/firebase';
import {
  GoogleAuthMode,
  SelectableRole,
  consumeGoogleRedirectResult,
  loginWithEmail,
  loginWithGoogle,
  logoutFirebase,
  registerWithEmail,
  requestPasswordReset,
} from '@/services/authService';
import {
  ensureUserProfile,
  getPendingProfileMeta,
  getUserProfile,
} from '@/services/userService';
import { useToast } from './ToastContext';
import { UserProfile } from '@/types';

export interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  isFirebaseReady: boolean;
  pendingPostAuthRedirect: string | null;
  clearAuthError: () => void;
  clearPendingPostAuthRedirect: () => void;
  signInWithGoogle: (
    preferredRole?: SelectableRole,
    options?: { mode?: GoogleAuthMode }
  ) => Promise<UserProfile | null>;
  signInWithEmail: (email: string, password: string) => Promise<UserProfile>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    role?: SelectableRole
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
  const [pendingPostAuthRedirect, setPendingPostAuthRedirect] = useState<string | null>(null);
  const activeAuthOpsRef = useRef(0);

  const clearAuthError = useCallback(() => setAuthError(null), []);
  const clearPendingPostAuthRedirect = useCallback(() => setPendingPostAuthRedirect(null), []);

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
        const redirectOutcome = await consumeGoogleRedirectResult();
        if (!cancelled && redirectOutcome) {
          setFirebaseUser(firebaseAuth.currentUser);
          setUser(redirectOutcome.profile);
          setAuthError(null);

          if (redirectOutcome.mode === 'signup' && redirectOutcome.requestedRole !== 'CLIENT') {
            if (redirectOutcome.profile.role === 'CLIENT') {
              showToast(
                'Esta conta Google já existia como Viajante. Complete abaixo para ativar seu perfil de parceiro.',
                'info'
              );
            } else {
              showToast(
                `Bem-vindo(a), ${redirectOutcome.profile.name}! Sua conta parceira está pronta.`,
                'success'
              );
            }
            setPendingPostAuthRedirect('/dashboard?mode=partner');
          } else {
            showToast(`Bem-vindo(a), ${redirectOutcome.profile.name}!`, 'success');
          }
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

          if (activeAuthOpsRef.current > 0) {
            return;
          }

          try {
            const profile = await ensureUserProfile(fbUser);
            if (!cancelled && activeAuthOpsRef.current === 0) {
              setUser(profile);
              setAuthError(null);
            }
          } catch (err) {
            if (!cancelled && activeAuthOpsRef.current === 0) {
              const message =
                err instanceof Error ? err.message : 'Perfil carregado em modo de contingência.';
              setAuthError(message);
              const pending = getPendingProfileMeta();
              setUser({
                uid: fbUser.uid,
                name: pending?.name || fbUser.displayName || 'Viajante SouNativo',
                email: (fbUser.email || '').trim().toLowerCase(),
                photoURL: fbUser.photoURL || undefined,
                role: pending?.role ?? 'CLIENT',
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
    async (preferredRole: SelectableRole = 'CLIENT', options?: { mode?: GoogleAuthMode }) => {
      setAuthError(null);
      activeAuthOpsRef.current += 1;
      try {
        const profile = await loginWithGoogle(preferredRole, options);
        if (profile) {
          setFirebaseUser(auth?.currentUser ?? null);
          setUser(profile);
          setLoading(false);
        }
        return profile;
      } finally {
        activeAuthOpsRef.current = Math.max(0, activeAuthOpsRef.current - 1);
      }
    },
    []
  );

  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    activeAuthOpsRef.current += 1;
    try {
      const profile = await loginWithEmail(email, password);
      setFirebaseUser(auth?.currentUser ?? null);
      setUser(profile);
      setLoading(false);
      return profile;
    } finally {
      activeAuthOpsRef.current = Math.max(0, activeAuthOpsRef.current - 1);
    }
  }, []);

  const handleEmailSignUp = useCallback(
    async (name: string, email: string, password: string, role: SelectableRole = 'CLIENT') => {
      setAuthError(null);
      activeAuthOpsRef.current += 1;
      try {
        const profile = await registerWithEmail(name, email, password, role);
        setFirebaseUser(auth?.currentUser ?? null);
        setUser(profile);
        setLoading(false);
        return profile;
      } finally {
        activeAuthOpsRef.current = Math.max(0, activeAuthOpsRef.current - 1);
      }
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
      setPendingPostAuthRedirect(null);
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
        pendingPostAuthRedirect,
        clearAuthError,
        clearPendingPostAuthRedirect,
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
