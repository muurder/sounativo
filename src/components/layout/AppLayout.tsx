import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { AuthModal } from '@/components/auth/AuthModal';
import { CookieBanner } from '@/components/privacy/CookieBanner';
import { useTheme } from '@/context/ThemeContext';

export const AppLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { agencyBrand } = useTheme();

  useEffect(() => {
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      setAuthModalMode(authParam);
    }
  }, [searchParams]);

  const closeAuth = () => {
    setAuthModalMode(null);
    if (searchParams.has('auth')) {
      const next = new URLSearchParams(searchParams);
      next.delete('auth');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-accent-50 text-stone-900 pb-16 md:pb-0">
      <Navbar
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
        agencyBrand={agencyBrand}
      />

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
      />

      <main id="main-content" className="flex-1 w-full">
        <Outlet context={{ openAuth: (mode: 'login' | 'signup') => setAuthModalMode(mode) }} />
      </main>

      <Footer />

      <BottomNav onOpenAuth={(mode) => setAuthModalMode(mode)} />

      <AuthModal
        isOpen={authModalMode !== null}
        initialMode={authModalMode ?? 'login'}
        onClose={closeAuth}
      />

      <CookieBanner />
    </div>
  );
};
