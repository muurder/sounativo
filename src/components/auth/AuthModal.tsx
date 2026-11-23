import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton';
import { AuthRoleSelector } from './AuthRoleSelector';
import { AuthEmailForm } from './AuthEmailForm';
import { PasswordResetForm } from './PasswordResetForm';
import { validateSignupInput } from '@/services/authService';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  initialRole?: Exclude<UserRole, 'ADMIN'>;
  onClose: (options?: { skipUrlCleanup?: boolean }) => void;
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
  initialRole = 'CLIENT',
  onClose,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, isFirebaseReady } =
    useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'>>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole(initialRole);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSubmitting(false);
      setErrorMsg('');
      setStatusMsg('');
    }
  }, [initialMode, initialRole, isOpen]);

  const clearFeedback = () => {
    if (errorMsg) setErrorMsg('');
    if (statusMsg) setStatusMsg('');
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setStatusMsg('');
    setSubmitting(true);
    let redirecting = false;
    try {
      const selectedRole = mode === 'signup' ? role : 'CLIENT';
      const profile = await signInWithGoogle(selectedRole, {
        mode: mode === 'signup' ? 'signup' : 'login',
      });
      if (!profile) {
        redirecting = true;
        setStatusMsg('Redirecionando para autenticação Google...');
        return;
      }

      if (mode === 'signup' && selectedRole !== 'CLIENT') {
        if (profile.role === 'CLIENT') {
          showToast(
            'Esta conta Google já existia como Viajante. Complete abaixo para ativar seu perfil de parceiro.',
            'info'
          );
        } else {
          showToast(`Bem-vindo(a), ${profile.name}! Sua conta parceira está pronta.`, 'success');
        }
        onClose({ skipUrlCleanup: true });
        onSuccess?.();
        navigate('/dashboard?mode=partner');
      } else {
        showToast(`Bem-vindo(a), ${profile.name}!`, 'success');
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao entrar com Google.');
    } finally {
      if (!redirecting) {
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (mode === 'signup') {
      try {
        validateSignupInput(name, email, password);
      } catch (validationErr) {
        setErrorMsg(
          validationErr instanceof Error
            ? validationErr.message
            : 'Verifique os dados informados.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const profile =
        mode === 'login'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(name, email, password, role);

      if (mode === 'signup' && role !== 'CLIENT') {
        showToast('Conta parceira criada no SouNativo!', 'success');
        onClose({ skipUrlCleanup: true });
        onSuccess?.();
        navigate('/dashboard?mode=partner');
      } else {
        showToast(
          mode === 'login' ? `Olá novamente, ${profile.name}!` : 'Conta criada no SouNativo!',
          'success'
        );
        onClose();
        onSuccess?.();
      }
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
      onClose={() => onClose()}
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
            setStatusMsg('');
          }}
        />
      ) : (
        <>
          {mode === 'signup' && (
            <AuthRoleSelector
              selectedRole={role}
              disabled={submitting}
              onSelect={(nextRole) => {
                setRole(nextRole);
                clearFeedback();
              }}
            />
          )}

          <GoogleSignInButton
            label={mode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
            onClick={() => void handleGoogle()}
            loading={submitting}
            disabled={submitting}
          />

          {statusMsg && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2 text-xs font-medium text-primary-800"
            >
              {statusMsg}
            </p>
          )}

          {errorMsg && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
            >
              {errorMsg}
            </p>
          )}

          <div className="relative my-5 flex items-center">
            <div className="flex-grow border-t border-stone-200" />
            <span className="mx-3 text-xs font-medium uppercase tracking-wider text-stone-400">
              ou via e-mail
            </span>
            <div className="flex-grow border-t border-stone-200" />
          </div>

          <AuthEmailForm
            mode={mode}
            role={role}
            name={name}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            submitting={submitting}
            errorMsg={errorMsg}
            hideErrorBanner
            onNameChange={(val) => {
              setName(val);
              clearFeedback();
            }}
            onEmailChange={(val) => {
              setEmail(val);
              clearFeedback();
            }}
            onPasswordChange={(val) => {
              setPassword(val);
              clearFeedback();
            }}
            onConfirmPasswordChange={(val) => {
              setConfirmPassword(val);
              clearFeedback();
            }}
            onForgotPassword={() => {
              setMode('reset');
              setErrorMsg('');
              setStatusMsg('');
            }}
            onSubmit={(e) => void handleSubmit(e)}
          />

          <p className="mt-5 text-center text-xs text-stone-600">
            {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui conta?'}{' '}
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrorMsg('');
                setStatusMsg('');
              }}
              className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2 disabled:opacity-60"
            >
              {mode === 'login' ? 'Cadastre-se grátis' : 'Fazer login'}
            </button>
          </p>
        </>
      )}
    </Modal>
  );
};
