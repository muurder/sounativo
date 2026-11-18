import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { submitContactMessageInFirestore } from '@/services/contactService';
import {
  getOrCreateCsrfToken,
  sanitizePlainText,
  verifyCsrfToken,
} from '@/utils/securitySanitizer';

export const ContactForm: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [csrfToken] = useState(() => getOrCreateCsrfToken());
  const [name, setName] = useState(() => user?.name ?? '');
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [message, setMessage] = useState(() => sanitizePlainText(searchParams.get('msg'), 2000));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get('msg');
    if (prefill) setMessage(sanitizePlainText(prefill, 2000));
  }, [searchParams]);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
    // Intentionally prefill only when user authenticates and fields are blank
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (csrfToken && !verifyCsrfToken(csrfToken)) {
      const expired = 'Sessão expirada. Recarregue a página e tente novamente.';
      setErrorMsg(expired);
      showToast(expired, 'error');
      return;
    }

    const cleanName = sanitizePlainText(name, 120);
    const cleanMessage = sanitizePlainText(message, 2000);
    if (cleanName.length < 2 || cleanMessage.length < 5) {
      const invalidMsg = 'Preencha nome válido e uma mensagem com pelo menos 5 caracteres.';
      setErrorMsg(invalidMsg);
      showToast(invalidMsg, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const isGroupQuote = Boolean(searchParams.get('msg'));
      await submitContactMessageInFirestore({
        name: cleanName,
        email,
        message: cleanMessage,
        source: isGroupQuote ? 'GROUP_QUOTE' : 'CONTACT_FORM',
      });
      setSubmitted(true);
      showToast('Mensagem registrada com sucesso pela equipe SouNativo!', 'success');
      setMessage('');
    } catch (err) {
      const failure =
        err instanceof Error ? err.message : 'Não foi possível enviar sua mensagem agora.';
      setErrorMsg(failure);
      showToast(failure, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4 shadow-card"
    >
      {submitted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
          <CheckCircle2 size={16} className="shrink-0" />
          Mensagem registrada! Responderemos no seu e-mail em até 1 dia útil.
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label htmlFor="contact-name" className="block text-xs font-semibold text-stone-700 mb-1">
          Seu nome
        </label>
        <input
          id="contact-name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-xs font-semibold text-stone-700 mb-1">
          Seu e-mail
        </label>
        <input
          id="contact-email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="contact-msg" className="block text-xs font-semibold text-stone-700 mb-1">
          Mensagem
        </label>
        <textarea
          id="contact-msg"
          rows={4}
          required
          minLength={5}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Como podemos ajudar?"
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
      </div>

      <Button type="submit" fullWidth loading={submitting}>
        {submitting ? 'Enviando mensagem...' : 'Enviar mensagem'}
      </Button>
    </form>
  );
};
