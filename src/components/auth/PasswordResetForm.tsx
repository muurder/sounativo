import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PasswordResetFormProps {
  initialEmail: string;
  onSubmitReset: (email: string) => Promise<void>;
  onBackToLogin: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  initialEmail,
  onSubmitReset,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await onSubmitReset(email);
      setSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar e-mail de redefinição.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-primary-600"
      >
        <ArrowLeft size={14} /> Voltar para o login
      </button>

      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-2">
          <p className="font-bold">Link de redefinição enviado!</p>
          <p>Confira a caixa de entrada e spam de {email}.</p>
        </div>
      ) : (
        <>
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              E-mail cadastrado
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
              />
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
            Enviar link de redefinição
          </Button>
        </>
      )}
    </form>
  );
};
