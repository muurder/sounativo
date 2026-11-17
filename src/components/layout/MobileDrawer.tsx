import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Compass, Globe, LayoutDashboard, LogOut, Map, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    { to: '/trips', label: 'Explorar Viagens', icon: Map },
    { to: '/agencies', label: 'Agências Verificadas', icon: Building2 },
    { to: '/guides', label: 'Guias Locais', icon: Compass },
    { to: '/about', label: 'Sobre o SouNativo', icon: Globe },
  ];

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
    >
      <div
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <Logo iconSize={24} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-4 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className="flex items-center gap-3 min-h-[46px] px-3 rounded-xl text-sm font-medium text-stone-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 space-y-2">
          {user ? (
            <>
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-primary-50 text-primary-700 text-sm font-semibold"
              >
                <LayoutDashboard size={18} />
                Meu Painel
              </Link>
              <Button
                variant="ghost"
                fullWidth
                leftIcon={<LogOut size={16} />}
                onClick={() => {
                  void logout();
                  onClose();
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                fullWidth
                onClick={() => {
                  onClose();
                  onOpenAuth('signup');
                }}
              >
                Criar Conta
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
              >
                Entrar
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
