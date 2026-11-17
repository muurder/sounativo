import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Compass, Home, MapPin, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';

interface BottomNavProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAuth }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = [
    { to: '/', label: 'Início', icon: Home, active: pathname === '/' },
    {
      to: '/trips',
      label: 'Explorar',
      icon: Compass,
      active: pathname.startsWith('/trips') || pathname.startsWith('/viagem'),
    },
    {
      to: '/agencies',
      label: 'Agências',
      icon: Building2,
      active: pathname.startsWith('/agencies'),
    },
    { to: '/guides', label: 'Guias', icon: MapPin, active: pathname.startsWith('/guides') },
  ];

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                item.active ? 'text-primary-600' : 'text-stone-500 hover:text-stone-800'
              )}
            >
              <Icon size={20} strokeWidth={item.active ? 2.4 : 1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user ? (
          <Link
            to="/dashboard"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
              pathname.startsWith('/dashboard')
                ? 'text-primary-600'
                : 'text-stone-500 hover:text-stone-800'
            )}
          >
            <User size={20} strokeWidth={pathname.startsWith('/dashboard') ? 2.4 : 1.9} />
            <span>Painel</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-stone-500 hover:text-primary-600 transition-colors"
          >
            <User size={20} strokeWidth={1.9} />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </nav>
  );
};
