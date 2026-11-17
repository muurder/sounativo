import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface NavbarProps {
  onOpenMenu: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  agencyBrand?: { name: string; slug: string; logo: string } | null;
}

const NAV_LINKS = [
  { to: '/trips', label: 'Explorar Viagens' },
  { to: '/agencies', label: 'Agências' },
  { to: '/guides', label: 'Guias Locais' },
  { to: '/about', label: 'Sobre' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenMenu, onOpenAuth, agencyBrand }) => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu lateral"
            className="md:hidden min-w-[44px] min-h-[44px] -ml-2 inline-flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Menu size={22} />
          </button>

          {agencyBrand ? (
            <Link to={`/${agencyBrand.slug}`} className="flex items-center gap-2.5 group">
              <img
                src={agencyBrand.logo}
                alt={agencyBrand.name}
                className="h-9 w-9 rounded-full object-cover border border-stone-200"
              />
              <span className="font-serif text-lg font-bold text-stone-900 group-hover:text-primary-600 transition-colors truncate max-w-[180px] sm:max-w-xs">
                {agencyBrand.name}
              </span>
            </Link>
          ) : (
            <Link
              to="/"
              aria-label="SouNativo — Página inicial"
              className="focus-visible:rounded-lg"
            >
              <Logo iconSize={26} />
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'text-sm font-medium transition-colors py-1 border-b-2',
                  active
                    ? 'border-primary-500 text-primary-600 font-semibold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 min-h-[40px] rounded-xl bg-primary-50 px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Meu Painel</span>
              </Link>

              <Tooltip content="Sair da conta" position="bottom">
                <button
                  type="button"
                  onClick={() => void logout()}
                  aria-label="Sair da conta"
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </Tooltip>

              <Link
                to="/dashboard"
                aria-label={`Perfil de ${user.name}`}
                className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary-200 bg-primary-500 text-white text-xs font-bold flex items-center justify-center shrink-0"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(user.name)
                )}
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="hidden sm:inline-flex min-h-[40px] items-center px-3 text-sm font-semibold text-stone-700 hover:text-primary-600 transition-colors"
              >
                Entrar
              </button>
              <Button size="sm" onClick={() => onOpenAuth('signup')}>
                Criar Conta
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
