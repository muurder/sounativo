import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserCredential } from 'firebase/auth';
import type { Agency, UserProfile } from '@/types';

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  deleteUser: vi.fn(),
  getRedirectResult: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  ensureUserProfile: vi.fn(),
  setPendingProfileMeta: vi.fn(),
  provisionPartnerAccount: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  deleteUser: mocks.deleteUser,
  getRedirectResult: mocks.getRedirectResult,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signInWithRedirect: mocks.signInWithRedirect,
  signOut: mocks.signOut,
  updateProfile: mocks.updateProfile,
}));

vi.mock('@/services/firebase', () => ({
  auth: { currentUser: null },
  googleProvider: { providerId: 'google.com' },
  isFirebaseConfigured: true,
}));

vi.mock('@/services/userService', () => ({
  ensureUserProfile: mocks.ensureUserProfile,
  setPendingProfileMeta: mocks.setPendingProfileMeta,
}));

vi.mock('@/services/partnerSignupService', () => ({
  provisionPartnerAccount: mocks.provisionPartnerAccount,
}));

import {
  consumeGoogleRedirectResult,
  loginWithGoogle,
  registerWithEmail,
  resetGoogleRedirectCacheForTests,
  validateSignupInput,
} from '@/services/authService';

function makeFirebaseUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'user-123',
    email: 'viajante@sounativo.com',
    displayName: 'Maria Nativa',
    photoURL: 'https://example.com/avatar.jpg',
    ...overrides,
  } as User;
}

function makeUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    uid: 'user-123',
    name: 'Maria Nativa',
    email: 'viajante@sounativo.com',
    role: 'CLIENT',
    favorites: [],
    notificationsEnabled: true,
    ...overrides,
  };
}

describe('authService — account creation & Google Auth flows', () => {
  const originalSessionStorage = globalThis.sessionStorage;
  let storageMap: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetGoogleRedirectCacheForTests();
    storageMap = new Map<string, string>();
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storageMap.set(key, value);
        },
        removeItem: (key: string) => {
          storageMap.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
  });

  it('validates signup inputs strictly and normalizes email/name', () => {
    expect(() => validateSignupInput('A', 'a@b.com', '123456')).toThrow(/mínimo 2 caracteres/i);
    expect(() => validateSignupInput('Ana Silva', 'invalido', '123456')).toThrow(/e-mail válido/i);
    expect(() => validateSignupInput('Ana Silva', 'ana@exemplo.com', '   12  ')).toThrow(
      /mínimo 6 caracteres/i
    );

    expect(validateSignupInput('  Ana Silva  ', '  ANA@Exemplo.COM ', 'segura123')).toEqual({
      cleanName: 'Ana Silva',
      cleanEmail: 'ana@exemplo.com',
    });
  });

  it('signs in with Google popup and provisions partner microsite on partner signup', async () => {
    const fbUser = makeFirebaseUser({ displayName: 'Agência Cerrado', email: 'ag@cerrado.com' });
    const partnerProfile = makeUserProfile({
      name: 'Agência Cerrado',
      email: 'ag@cerrado.com',
      role: 'AGENCY',
    });

    mocks.signInWithPopup.mockResolvedValue({ user: fbUser } as UserCredential);
    mocks.ensureUserProfile.mockResolvedValue(partnerProfile);
    mocks.provisionPartnerAccount.mockResolvedValue({ id: 'ag-99' } as Agency);

    const result = await loginWithGoogle('AGENCY', { mode: 'signup' });

    expect(mocks.setPendingProfileMeta).toHaveBeenCalledWith({ role: 'AGENCY' });
    expect(mocks.ensureUserProfile).toHaveBeenCalledWith(fbUser, 'AGENCY');
    expect(mocks.provisionPartnerAccount).toHaveBeenCalledWith({
      profile: partnerProfile,
      isGuide: false,
      displayName: 'Agência Cerrado',
    });
    expect(result?.agencyId).toBe('ag-99');
  });

  it('falls back gracefully to redirect without throwing on popup-blocked or unsupported env', async () => {
    mocks.signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
    mocks.signInWithRedirect.mockResolvedValueOnce(undefined);

    const blockedRes = await loginWithGoogle('GUIDE', { mode: 'signup' });
    expect(blockedRes).toBeNull();
    expect(mocks.signInWithRedirect).toHaveBeenCalledTimes(1);
    expect(storageMap.get('sounativo_pending_google_auth')).toBe(
      JSON.stringify({ role: 'GUIDE', mode: 'signup' })
    );

    mocks.signInWithPopup.mockRejectedValueOnce({
      code: 'auth/operation-not-supported-in-this-environment',
    });
    mocks.signInWithRedirect.mockResolvedValueOnce(undefined);

    const unsupportedRes = await loginWithGoogle('CLIENT', { mode: 'login' });
    expect(unsupportedRes).toBeNull();
    expect(mocks.signInWithRedirect).toHaveBeenCalledTimes(2);
    expect(storageMap.get('sounativo_pending_google_auth')).toBe(
      JSON.stringify({ role: 'CLIENT', mode: 'login' })
    );
  });

  it('deduplicates consumeGoogleRedirectResult (StrictMode-safe) and restores partner signup', async () => {
    storageMap.set(
      'sounativo_pending_google_auth',
      JSON.stringify({ role: 'GUIDE', mode: 'signup' })
    );

    const fbUser = makeFirebaseUser({ displayName: 'Guia Pantanal', email: 'guia@pantanal.br' });
    const guideProfile = makeUserProfile({
      name: 'Guia Pantanal',
      email: 'guia@pantanal.br',
      role: 'GUIDE',
    });

    mocks.getRedirectResult.mockResolvedValue({ user: fbUser } as UserCredential);
    mocks.ensureUserProfile.mockResolvedValue(guideProfile);
    mocks.provisionPartnerAccount.mockResolvedValue({ id: 'guide-42' } as Agency);

    const [firstCall, secondCall] = await Promise.all([
      consumeGoogleRedirectResult(),
      consumeGoogleRedirectResult(),
    ]);

    expect(mocks.getRedirectResult).toHaveBeenCalledTimes(1);
    expect(mocks.ensureUserProfile).toHaveBeenCalledTimes(1);
    expect(mocks.provisionPartnerAccount).toHaveBeenCalledTimes(1);
    expect(firstCall).toEqual({
      profile: { ...guideProfile, agencyId: 'guide-42' },
      mode: 'signup',
      requestedRole: 'GUIDE',
    });
    expect(secondCall).toEqual(firstCall);
    expect(storageMap.has('sounativo_pending_google_auth')).toBe(false);
  });

  it('registers partner via email, provisions microsite, and rolls back Auth user if Firestore profile init fails', async () => {
    const fbUser = makeFirebaseUser({ email: 'parceiro@teste.com' });
    const agencyProfile = makeUserProfile({
      name: 'Parceiro Teste',
      email: 'parceiro@teste.com',
      role: 'AGENCY',
    });

    mocks.createUserWithEmailAndPassword.mockResolvedValue({ user: fbUser } as UserCredential);
    mocks.updateProfile.mockResolvedValue(undefined);
    mocks.ensureUserProfile.mockResolvedValueOnce(agencyProfile);
    mocks.provisionPartnerAccount.mockResolvedValueOnce({ id: 'ag-77' } as Agency);

    const ok = await registerWithEmail('Parceiro Teste', 'parceiro@teste.com', 'senha123', 'AGENCY');
    expect(ok.agencyId).toBe('ag-77');
    expect(ok.role).toBe('AGENCY');

    // Simulate Firestore failure after Auth account creation -> must roll back Auth user
    mocks.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fbUser } as UserCredential);
    mocks.ensureUserProfile.mockRejectedValueOnce(new Error('Firestore indisponível'));
    mocks.deleteUser.mockResolvedValueOnce(undefined);

    await expect(
      registerWithEmail('Falha Teste', 'falha@teste.com', 'senha123', 'CLIENT')
    ).rejects.toThrow(/Firestore indisponível/i);

    expect(mocks.deleteUser).toHaveBeenCalledWith(fbUser);
  });
});
