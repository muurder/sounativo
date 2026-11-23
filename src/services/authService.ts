import {
  UserCredential,
  createUserWithEmailAndPassword,
  deleteUser,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';
import { provisionPartnerAccount } from './partnerSignupService';
import { ensureUserProfile, setPendingProfileMeta } from './userService';
import { UserProfile, UserRole } from '@/types';

export type GoogleAuthMode = 'login' | 'signup';
export type SelectableRole = Exclude<UserRole, 'ADMIN'>;

export interface GoogleRedirectResult {
  profile: UserProfile;
  mode: GoogleAuthMode;
  requestedRole: SelectableRole;
}

interface PendingGoogleAuthState {
  role: SelectableRole;
  mode: GoogleAuthMode;
}

const PENDING_GOOGLE_AUTH_KEY = 'sounativo_pending_google_auth';
const LEGACY_PENDING_ROLE_KEY = 'sounativo_pending_google_role';
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_SELECTABLE_ROLES = new Set<SelectableRole>(['CLIENT', 'AGENCY', 'GUIDE']);

let redirectConsumePromise: Promise<GoogleRedirectResult | null> | null = null;

export function resetGoogleRedirectCacheForTests(): void {
  redirectConsumePromise = null;
}

function savePendingGoogleRedirect(state: PendingGoogleAuthState): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(PENDING_GOOGLE_AUTH_KEY, JSON.stringify(state));
    sessionStorage.removeItem(LEGACY_PENDING_ROLE_KEY);
  } catch {
    // Storage restricted (private browsing or sandbox)
  }
}

function clearPendingGoogleRedirect(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_GOOGLE_AUTH_KEY);
    sessionStorage.removeItem(LEGACY_PENDING_ROLE_KEY);
  } catch {
    // Ignore storage access errors
  }
}

function consumePendingGoogleRedirect(): PendingGoogleAuthState {
  const fallback: PendingGoogleAuthState = { role: 'CLIENT', mode: 'login' };
  if (typeof sessionStorage === 'undefined') return fallback;

  try {
    const raw = sessionStorage.getItem(PENDING_GOOGLE_AUTH_KEY);
    const legacyRole = sessionStorage.getItem(LEGACY_PENDING_ROLE_KEY);
    clearPendingGoogleRedirect();

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PendingGoogleAuthState>;
      const role =
        parsed.role && VALID_SELECTABLE_ROLES.has(parsed.role) ? parsed.role : 'CLIENT';
      const mode: GoogleAuthMode = parsed.mode === 'signup' ? 'signup' : 'login';
      return { role, mode };
    }

    if (legacyRole && VALID_SELECTABLE_ROLES.has(legacyRole as SelectableRole)) {
      return { role: legacyRole as SelectableRole, mode: 'signup' };
    }
  } catch {
    clearPendingGoogleRedirect();
  }

  return fallback;
}

export function validateSignupInput(
  name: string,
  email: string,
  password: string
): { cleanName: string; cleanEmail: string } {
  const cleanName = name.trim().slice(0, 120);
  if (cleanName.length < 2) {
    throw new Error('Informe seu nome completo ou nome profissional (mínimo 2 caracteres).');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || cleanEmail.length > 254 || !EMAIL_PATTERN.test(cleanEmail)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }

  if (!password || password.trim().length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }

  return { cleanName, cleanEmail };
}

export function mapFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Login com Google cancelado antes da conclusão.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o popup do Google. Libere popups para este site e tente novamente.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Este navegador ou ambiente não suporta popup de login. Tentando redirecionamento seguro...';
    case 'auth/web-storage-unsupported':
      return 'Seu navegador bloqueou cookies ou armazenamento local necessários para o login.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Console (Authentication → Authorized domains).';
    case 'auth/operation-not-allowed':
      return 'Provedor Google ou E-mail/Senha não ativado no Firebase Console.';
    case 'auth/admin-restricted-operation':
      return 'Cadastro temporariamente restrito neste projeto Firebase.';
    case 'auth/account-exists-with-different-credential':
      return 'Este e-mail já está vinculado a outro método de login (use E-mail/Senha).';
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Informe um endereço de e-mail válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/weak-password':
    case 'auth/missing-password':
      return 'A senha deve ter no mínimo 6 caracteres.';
    case 'auth/password-does-not-meet-requirements':
      return 'A senha não atende aos requisitos mínimos de segurança do projeto.';
    case 'auth/user-disabled':
      return 'Esta conta foi suspensa pela administração. Entre em contato com o suporte.';
    case 'auth/requires-recent-login':
      return 'Por segurança, esta operação exige um login recente. Saia e entre novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão de rede ao contatar o Firebase Auth. Verifique sua internet.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes.';
    case 'auth/internal-error':
      return 'Erro interno de comunicação com o Firebase Auth. Tente novamente em instantes.';
    case 'auth/invalid-api-key':
      return 'Chave de API do Firebase inválida neste ambiente.';
    case 'auth/app-not-authorized':
      return 'Este aplicativo não está autorizado a usar o Firebase Authentication neste domínio.';
    default:
      return code
        ? `Não foi possível autenticar (${code}). Verifique sua conexão e tente novamente.`
        : 'Não foi possível autenticar. Verifique sua conexão e tente novamente.';
  }
}

async function finalizeGoogleAccount(
  credential: UserCredential,
  preferredRole: SelectableRole,
  mode: GoogleAuthMode
): Promise<UserProfile> {
  let profile = await ensureUserProfile(credential.user, preferredRole);

  if (
    mode === 'signup' &&
    (preferredRole === 'AGENCY' || preferredRole === 'GUIDE') &&
    (profile.role === 'AGENCY' || profile.role === 'GUIDE')
  ) {
    const agency = await provisionPartnerAccount({
      profile,
      isGuide: preferredRole === 'GUIDE',
      displayName: profile.name,
    });
    if (agency) {
      profile = { ...profile, agencyId: agency.id };
    }
  }

  return profile;
}

export async function consumeGoogleRedirectResult(): Promise<GoogleRedirectResult | null> {
  if (!isFirebaseConfigured || !auth) return null;
  if (redirectConsumePromise) return redirectConsumePromise;

  const firebaseAuth = auth;
  redirectConsumePromise = (async (): Promise<GoogleRedirectResult | null> => {
    try {
      const result = await getRedirectResult(firebaseAuth);
      if (!result?.user) {
        clearPendingGoogleRedirect();
        return null;
      }

      const pending = consumePendingGoogleRedirect();
      setPendingProfileMeta({ role: pending.role });
      const profile = await finalizeGoogleAccount(result, pending.role, pending.mode);
      return {
        profile,
        mode: pending.mode,
        requestedRole: pending.role,
      };
    } catch (err: unknown) {
      clearPendingGoogleRedirect();
      setPendingProfileMeta(null);
      const code = (err as { code?: string }).code ?? '';
      throw new Error(code ? mapFirebaseAuthError(code) : err instanceof Error ? err.message : mapFirebaseAuthError(''));
    }
  })();

  return redirectConsumePromise;
}

export async function loginWithGoogle(
  preferredRole: SelectableRole = 'CLIENT',
  options?: { mode?: GoogleAuthMode }
): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error(
      'Firebase ainda não configurado no .env.local. Preencha VITE_FIREBASE_* para habilitar o Login com Google.'
    );
  }

  const mode: GoogleAuthMode = options?.mode ?? 'login';
  setPendingProfileMeta({ role: preferredRole });

  let credential: UserCredential;
  try {
    credential = await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    setPendingProfileMeta(null);
    const code = (err as { code?: string }).code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      savePendingGoogleRedirect({ role: preferredRole, mode });
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr: unknown) {
        clearPendingGoogleRedirect();
        const redirectCode = (redirectErr as { code?: string }).code ?? '';
        throw new Error(mapFirebaseAuthError(redirectCode));
      }
    }
    throw new Error(mapFirebaseAuthError(code));
  }

  return finalizeGoogleAccount(credential, preferredRole, mode);
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }
  if (!password) {
    throw new Error('Informe sua senha.');
  }

  let credential: UserCredential;
  try {
    credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
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
  role: SelectableRole = 'CLIENT'
): Promise<UserProfile> {
  if (!auth) throw new Error('Firebase Auth não configurado.');

  const { cleanName, cleanEmail } = validateSignupInput(name, email, password);
  setPendingProfileMeta({ name: cleanName, role });

  let credential: UserCredential;
  try {
    credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
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

  let profile: UserProfile;
  try {
    profile = await ensureUserProfile(credential.user, role, cleanName);
  } catch (profileErr: unknown) {
    setPendingProfileMeta(null);
    try {
      await deleteUser(credential.user);
    } catch {
      // Best-effort rollback so failed profile provisioning never leaves a zombie Auth user
    }
    throw profileErr instanceof Error
      ? profileErr
      : new Error('Não foi possível inicializar sua conta no banco de dados.');
  }

  if (role === 'AGENCY' || role === 'GUIDE') {
    const agency = await provisionPartnerAccount({
      profile,
      isGuide: role === 'GUIDE',
      displayName: cleanName,
    });
    if (agency) {
      profile = { ...profile, role, agencyId: agency.id };
    }
  }

  return profile;
}

export async function logoutFirebase(): Promise<void> {
  setPendingProfileMeta(null);
  clearPendingGoogleRedirect();
  redirectConsumePromise = null;
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth não configurado.');
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
    throw new Error('Informe um endereço de e-mail válido.');
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? '';
    throw new Error(mapFirebaseAuthError(code));
  }
}
