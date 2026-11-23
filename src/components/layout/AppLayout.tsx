import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { CookieBanner } from '@/components/privacy/CookieBanner';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { trackPageView } from '@/services/telemetryService';
import { UserRole } from '@/types';

type SelectableRole = Exclude<UserRole, 'ADMIN'>;

interface AuthModalState {
  mode: 'login' | 'signup';
  role?: SelectableRole;
}

const SIGNUP_HASHES = new Set(['signup', 'cadastro', 'criar-conta', 'register']);
const LOGIN_HASHES = new Set(['login', 'entrar']);

function parseRoleParam(rawRole: string | null): SelectableRole | undefined {
  const normalized = (rawRole ?? '').trim().toLowerCase();
  if (normalized === 'agency') return 'AGENCY';
  if (normalized === 'guide') return 'GUIDE';
  if (normalized === 'client') return 'CLIENT';
  return undefined;
}

export const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModalState | null>(null);
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, pendingPostAuthRedirect, clearPendingPostAuthRedirect } = useAuth();
  const { agencyBrand } = useTheme();

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!loading && user && pendingPostAuthRedirect) {
      const target = pendingPostAuthRedirect;
      clearPendingPostAuthRedirect();
      setAuthModal(null);
      navigate(target, { replace: true });
    }
  }, [clearPendingPostAuthRedirect, loading, navigate, pendingPostAuthRedirect, user]);

  useEffect(() => {
    if (loading) return;

    const authParam = searchParams.get('auth');
    const roleParam = parseRoleParam(searchParams.get('role'));
    const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();

    let detectedMode: 'login' | 'signup' | null = null;
    if (authParam === 'login' || authParam === 'signup') {
      detectedMode = authParam;
    } else if (SIGNUP_HASHES.has(cleanHash)) {
      detectedMode = 'signup';
    } else if (LOGIN_HASHES.has(cleanHash)) {
      detectedMode = 'login';
    }

    if (user) {
      setAuthModal(null);
      const isAuthHash = SIGNUP_HASHES.has(cleanHash) || LOGIN_HASHES.has(cleanHash);
      if (searchParams.has('auth') || searchParams.has('role') || isAuthHash) {
        const next = new URLSearchParams(searchParams);
        next.delete('auth');
        next.delete('role');
        const searchString = next.toString() ? `?${next.toString()}` : '';
        navigate(`${pathname}${searchString}`, { replace: true });
      }
      return;
    }

    if (detectedMode) {
      setAuthModal({ mode: detectedMode, role: roleParam });
    }
  }, [hash, loading, navigate, pathname, searchParams, user]);

  const openAuth = useCallback(
    (mode: 'login' | 'signup', role?: SelectableRole) => {
      if (user) return;
      setAuthModal({ mode, role });
    },
    [user]
  );

  const closeAuth = useCallback(
    (options?: { skipUrlCleanup?: boolean }) => {
      setAuthModal(null);
      if (options?.skipUrlCleanup) return;

      let changed = false;
      const next = new URLSearchParams(searchParams);
      if (next.has('auth')) {
        next.delete('auth');
        changed = true;
      }
      if (next.has('role')) {
        next.delete('role');
        changed = true;
      }
      const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
      const isAuthHash = SIGNUP_HASHES.has(cleanHash) || LOGIN_HASHES.has(cleanHash);

      if (changed || isAuthHash) {
        const searchString = next.toString() ? `?${next.toString()}` : '';
        navigate(`${pathname}${searchString}`, { replace: true });
      }
    },
    [hash, navigate, pathname, searchParams]
  );

  return (
    <div className="min-h-screen flex flex-col bg-accent-50 text-stone-900 pb-16 md:pb-0">
      <Navbar
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenAuth={(mode) => openAuth(mode)}
        agencyBrand={agencyBrand}
      />

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenAuth={(mode) => openAuth(mode)}
      />

      <main id="main-content" className="flex-1 w-full">
        <ErrorBoundary resetKey={pathname}>
          <Outlet context={{ openAuth }} />
        </ErrorBoundary>
      </main>

      <Footer />

      <BottomNav onOpenAuth={(mode) => openAuth(mode)} />

      <AuthModal
        isOpen={authModal !== null}
        initialMode={authModal?.mode ?? 'login'}
        initialRole={authModal?.role}
        onClose={closeAuth}
      />

      <CookieBanner />
    </div>
  );
};
