import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { AuthRoleSelector } from './AuthRoleSelector';
import { AuthEmailForm } from './AuthEmailForm';
import { PasswordResetForm } from './PasswordResetForm';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthModalMode = 'login' | 'signup' | 'reset';

const MODAL_COPY: Record<AuthModalMode, { title: string; description: string }> = {
  login: {
    title: 'Entrar no SouNativo',
    description: 'Acesse suas reservas, favoritos e painéis com segurança.',
  },
  signup: {
    title: 'Criar conta gratuita',
    description: 'Conecte-se ao maior marketplace de experiências autênticas do Brasil.',
  },
  reset: {
    title: 'Recuperar senha',
    description: 'Enviaremos um link oficial do Firebase Auth para redefinir sua senha.',
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, isFirebaseReady } =
    useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'>>('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole('CLIENT');
      setName('');
      setEmail('');
      setPassword('');
      setErrorMsg('');
    }
  }, [initialMode, isOpen]);

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

  const handleReset = async (targetEmail: string) => {
    await sendPasswordReset(targetEmail);
    showToast('E-mail de redefinição enviado!', 'success');
  };

  const headerCopy = MODAL_COPY[mode];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={headerCopy.title}
      description={headerCopy.description}
      maxWidthClass="max-w-md"
    >
      {!isFirebaseReady && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          Firebase Auth em espera: preencha as variáveis <code>VITE_FIREBASE_*</code> no arquivo{' '}
          <code>.env.local</code> (ou na Vercel) para ativar o login real.
        </div>
      )}

      {mode === 'reset' ? (
        <PasswordResetForm
          initialEmail={email}
          onSubmitReset={handleReset}
          onBackToLogin={() => {
            setMode('login');
            setErrorMsg('');
          }}
        />
      ) : (
        <>
          {mode === 'signup' && <AuthRoleSelector selectedRole={role} onSelect={setRole} />}

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

          <AuthEmailForm
            mode={mode}
            name={name}
            email={email}
            password={password}
            submitting={submitting}
            errorMsg={errorMsg}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onForgotPassword={() => {
              setMode('reset');
              setErrorMsg('');
            }}
            onSubmit={handleSubmit}
          />

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
        </>
      )}
    </Modal>
  );
};
