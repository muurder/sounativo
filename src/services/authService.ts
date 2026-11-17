import {
  UserCredential,
  createUserWithEmailAndPassword,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { ensureUserProfile, setPendingProfileMeta } from './userService';
import { UserProfile, UserRole } from '@/types';

const PENDING_ROLE_KEY = 'sounativo_pending_google_role';

export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Login com Google cancelado antes da conclusão.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o popup do Google. Libere popups para este site e tente novamente.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Console (Authentication → Authorized domains).';
    case 'auth/operation-not-allowed':
      return 'Provedor Google ou E-mail/Senha não ativado no Firebase Console.';
    case 'auth/account-exists-with-different-credential':
      return 'Este e-mail já está vinculado a outro método de login (use E-mail/Senha).';
    case 'auth/invalid-email':
      return 'Informe um endereço de e-mail válido.';
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
      return code
        ? `Não foi possível autenticar (${code}). Verifique sua conexão e tente novamente.`
        : 'Não foi possível autenticar. Verifique sua conexão e tente novamente.';
  }
}

export async function consumeGoogleRedirectResult(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const storedRole = sessionStorage.getItem(PENDING_ROLE_KEY) as Exclude<
      UserRole,
      'ADMIN'
    > | null;
    sessionStorage.removeItem(PENDING_ROLE_KEY);
    return await ensureUserProfile(result.user, storedRole ?? 'CLIENT');
  } catch (err: unknown) {
    sessionStorage.removeItem(PENDING_ROLE_KEY);
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
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

  setPendingProfileMeta({ role: preferredRole });
  let credential: UserCredential;
  try {
    credential = await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    setPendingProfileMeta(null);
    const code = (err as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked') {
      sessionStorage.setItem(PENDING_ROLE_KEY, preferredRole);
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecionando para autenticação Google...');
    }
    throw new Error(mapFirebaseAuthError(code));
  }
  return ensureUserProfile(credential.user, preferredRole);
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  let credential: UserCredential;
  try {
    credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
  return ensureUserProfile(credential.user);
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: Exclude<UserRole, 'ADMIN'> = 'CLIENT'
): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  const cleanName = name.trim();
  setPendingProfileMeta({ name: cleanName, role });

  let credential: UserCredential;
  try {
    credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  } catch (err: unknown) {
    setPendingProfileMeta(null);
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }

  try {
    await updateProfile(credential.user, { displayName: cleanName });
  } catch {
    // Non-fatal; Firestore profile still receives cleanName below
  }

  return ensureUserProfile(credential.user, role, cleanName);
}

export async function logoutFirebase(): Promise<void> {
  setPendingProfileMeta(null);
  if (!auth) return;
  await signOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
}
