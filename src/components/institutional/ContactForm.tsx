import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import {
  getOrCreateCsrfToken,
  sanitizePlainText,
  verifyCsrfToken,
} from '@/utils/securitySanitizer';

export const ContactForm: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [csrfToken] = useState(() => getOrCreateCsrfToken());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(() => sanitizePlainText(searchParams.get('msg'), 2000));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get('msg');
    if (prefill) setMessage(sanitizePlainText(prefill, 2000));
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (csrfToken && !verifyCsrfToken(csrfToken)) {
      showToast('Sessão expirada. Recarregue a página e tente novamente.', 'error');
      return;
    }
    const cleanName = sanitizePlainText(name, 120);
    const cleanMessage = sanitizePlainText(message, 2000);
    if (!cleanName || cleanMessage.length < 5) {
      showToast('Preencha nome e mensagem válidos.', 'error');
      return;
    }
    setSubmitted(true);
    showToast('Mensagem recebida pela equipe SouNativo!', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4 shadow-card"
    >
      {submitted && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900">
          <CheckCircle2 size={16} className="shrink-0" />
          Mensagem enviada! Responderemos no seu e-mail em até 1 dia útil.
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu e-mail"
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Como podemos ajudar?"
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
      </div>

      <Button type="submit" fullWidth>
        Enviar mensagem
      </Button>
    </form>
  );
};
