import React, { useState } from 'react';
import { Briefcase, Compass, Eye, EyeOff, Lock, LucideIcon, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

const ROLE_OPTIONS: Array<{
  id: Exclude<UserRole, 'ADMIN'>;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  { id: 'CLIENT', label: 'Viajante', hint: 'Reservar pacotes', icon: User },
  { id: 'AGENCY', label: 'Agência', hint: 'Publicar roteiros', icon: Briefcase },
  { id: 'GUIDE', label: 'Guia Local', hint: 'Perfil Cadastur', icon: Compass },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isFirebaseReady } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'>>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogle = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const profile = await signInWithGoogle(mode === 'signup' ? role : 'CLIENT');
      showToast(`Bem-vindo(a), ${profile.name}!`, 'success');
      onClose();
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao entrar com Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const profile =
        mode === 'login'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(name, email, password, role);

      showToast(
        mode === 'login' ? `Olá novamente, ${profile.name}!` : 'Conta criada no SouNativo!',
        'success'
      );
      onClose();
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Entrar no SouNativo' : 'Criar conta gratuita'}
      description={
        mode === 'login'
          ? 'Acesse suas reservas, favoritos e painéis com segurança.'
          : 'Conecte-se ao maior marketplace de experiências autênticas do Brasil.'
      }
      maxWidthClass="max-w-md"
    >
      {!isFirebaseReady && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Firebase Auth em espera: preencha as variáveis <code>VITE_FIREBASE_*</code> no arquivo{' '}
          <code>.env.local</code> (ou na Vercel) para ativar o login real.
        </div>
      )}

      {mode === 'signup' && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Como você quer usar o SouNativo?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = role === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all min-h-[68px]',
                    selected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  )}
                >
                  <Icon size={18} />
                  <span className="mt-1 text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-stone-500 leading-tight">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <GoogleSignInButton
        label={mode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
        onClick={handleGoogle}
        loading={submitting}
      />

      <div className="relative my-5 flex items-center">
        <div className="flex-grow border-t border-stone-200" />
        <span className="mx-3 text-xs font-medium uppercase tracking-wider text-stone-400">
          ou via e-mail
        </span>
        <div className="flex-grow border-t border-stone-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <div>
            <label htmlFor="auth-name" className="block text-xs font-semibold text-stone-700 mb-1">
              Nome completo
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou nome da agência"
                className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="block text-xs font-semibold text-stone-700 mb-1">
            E-mail
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            Senha
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-11 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-stone-500 hover:text-stone-800 rounded-lg"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {errorMsg && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
          >
            {errorMsg}
          </p>
        )}

        <Button type="submit" fullWidth loading={submitting}>
          {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-stone-600">
        {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui conta?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setErrorMsg('');
          }}
          className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2"
        >
          {mode === 'login' ? 'Cadastre-se grátis' : 'Fazer login'}
        </button>
      </p>
    </Modal>
  );
};
