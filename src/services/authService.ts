import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { ensureUserProfile } from './userService';
import { UserProfile, UserRole } from '@/types';

export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado antes da conclusão.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Console (Authentication → Authorized domains).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
      return 'A senha deve ter no mínimo 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes.';
    default:
      return 'Não foi possível autenticar. Verifique sua conexão e tente novamente.';
  }
}

export async function loginWithGoogle(
  preferredRole: Exclude<UserRole, 'ADMIN'> = 'CLIENT'
): Promise<UserProfile> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error(
      'Firebase ainda não configurado no .env.local. Preencha VITE_FIREBASE_* para habilitar o Login com Google.'
    );
  }

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return await ensureUserProfile(credential.user, preferredRole);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecionando para autenticação Google...');
    }
    throw new Error(mapFirebaseAuthError(code));
  }
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return await ensureUserProfile(credential.user);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: Exclude<UserRole, 'ADMIN'> = 'CLIENT'
): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return await ensureUserProfile(credential.user, role);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
}

export async function logoutFirebase(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  await sendPasswordResetEmail(auth, email);
}
