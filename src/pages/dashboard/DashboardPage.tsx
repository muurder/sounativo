import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AlertCircle, Briefcase, Compass, Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { MASTER_ADMIN_EMAIL } from '@/services/firebase.config';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClientDashboardView } from './ClientDashboardView';
import { PartnerDashboardView } from './PartnerDashboardView';
import { AdminDashboardView } from './AdminDashboardView';
import { PrivacySettings } from './PrivacySettings';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const DashboardPage: React.FC = () => {
  const { openAuth } = useOutletContext<OutletContextValue>();
  const [searchParams] = useSearchParams();
  const { user, loading, authError, clearAuthError, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [googleBusy, setGoogleBusy] = useState(false);

  const normalizedEmail = (user?.email ?? '').toLowerCase();
  const isMasterAdmin = Boolean(
    user &&
    (user.role === 'ADMIN' || (MASTER_ADMIN_EMAIL && normalizedEmail === MASTER_ADMIN_EMAIL))
  );

  const [viewMode, setViewMode] = useState<'traveler' | 'partner' | 'admin' | 'privacy'>(() => {
    const mode = searchParams.get('mode');
    if (mode === 'privacy') return 'privacy';
    return mode === 'partner' ? 'partner' : 'traveler';
  });

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'privacy') {
      setViewMode('privacy');
    } else if (mode === 'admin' && isMasterAdmin) {
      setViewMode('admin');
    } else if (mode === 'partner' || user?.role === 'AGENCY' || user?.role === 'GUIDE') {
      setViewMode('partner');
    } else {
      setViewMode('traveler');
    }
  }, [isMasterAdmin, searchParams, user?.role, user?.uid]);

  const handleDashboardGoogle = async () => {
    setGoogleBusy(true);
    try {
      const signed = await signInWithGoogle();
      showToast(`Bem-vindo(a), ${signed.name}!`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao entrar com Google.', 'error');
    } finally {
      setGoogleBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-stone-500">
        Verificando sessão Firebase...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-editorial text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Compass size={28} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">
            Acesse seu Painel SouNativo
          </h1>
          <p className="text-sm text-stone-600">
            Entre com sua conta Google para gerenciar reservas, favoritos, privacidade ou operar sua
            agência.
          </p>

          {authError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs text-red-800 flex items-start gap-2"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          <GoogleSignInButton loading={googleBusy} onClick={() => void handleDashboardGoogle()} />
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              clearAuthError();
              openAuth('login');
            }}
          >
            Entrar com e-mail e senha
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {authError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-center justify-between gap-3"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-700" />
            {authError}
          </span>
          <button
            type="button"
            onClick={clearAuthError}
            className="font-semibold underline hover:text-amber-950"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="primary">{user.role}</Badge>
            {isMasterAdmin && user.role !== 'ADMIN' && <Badge tone="secondary">Admin Master</Badge>}
            <span className="text-xs text-stone-500">{user.email}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Olá, {user.name || 'Viajante'}
          </h1>
        </div>

        <div className="inline-flex flex-wrap rounded-xl border border-stone-200 bg-white p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode('traveler')}
            className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'traveler' ? 'bg-primary-500 text-white' : 'text-stone-600'
            }`}
          >
            <User size={15} /> Modo Viajante
          </button>
          <button
            type="button"
            onClick={() => setViewMode('partner')}
            className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'partner' ? 'bg-primary-500 text-white' : 'text-stone-600'
            }`}
          >
            <Briefcase size={15} /> Modo Agência / Guia
          </button>
          <button
            type="button"
            onClick={() => setViewMode('privacy')}
            className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'privacy' ? 'bg-primary-500 text-white' : 'text-stone-600'
            }`}
          >
            <Lock size={15} /> Minha Privacidade
          </button>
          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setViewMode('admin')}
              className={`inline-flex items-center gap-2 min-h-[38px] px-4 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'admin' ? 'bg-primary-500 text-white' : 'text-stone-600'
              }`}
            >
              <ShieldCheck size={15} /> Admin Master
            </button>
          )}
        </div>
      </div>

      {viewMode === 'traveler' && <ClientDashboardView />}
      {viewMode === 'partner' && <PartnerDashboardView />}
      {viewMode === 'privacy' && <PrivacySettings />}
      {viewMode === 'admin' && isMasterAdmin && <AdminDashboardView />}
    </div>
  );
};

export default DashboardPage;
