import React from 'react';
import { Globe, Mail, MapPin, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export const AboutPage: React.FC = () => (
  <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
    <div className="text-center space-y-3">
      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
        Nossa missão é conectar viajantes ao Brasil autêntico
      </h1>
      <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto">
        O SouNativo elimina ruídos entre quem sonha em explorar destinos reais e quem opera com
        segurança, curadoria e respeito local.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-card">
      <div className="space-y-2">
        <Globe className="text-primary-600" size={26} />
        <h2 className="font-serif text-xl font-bold text-stone-900">Território Nacional</h2>
        <p className="text-sm text-stone-600">
          Curadoria da Amazônia ao Sul do Brasil, valorizando economias locais.
        </p>
      </div>
      <div className="space-y-2">
        <ShieldCheck className="text-primary-600" size={26} />
        <h2 className="font-serif text-xl font-bold text-stone-900">Verificação Real</h2>
        <p className="text-sm text-stone-600">
          Agências e guias com registro ativo e avaliações transparentes.
        </p>
      </div>
      <div className="space-y-2">
        <Users className="text-primary-600" size={26} />
        <h2 className="font-serif text-xl font-bold text-stone-900">Comunidade Ativa</h2>
        <p className="text-sm text-stone-600">
          Viajantes que buscam natureza, cultura e memória com conforto.
        </p>
      </div>
    </div>
  </div>
);

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10 text-center space-y-2">
        <h1 className="font-serif text-4xl font-bold text-stone-900">Fale com o SouNativo</h1>
        <p className="text-sm sm:text-base text-stone-600">
          Suporte a viajantes, onboarding de agências e parcerias regionais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-5 shadow-card">
          <div className="flex items-center gap-3">
            <Mail className="text-primary-600" size={20} />
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">E-mail</p>
              <p className="text-sm font-semibold text-stone-900">suporte@sounativo.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="text-secondary-600" size={20} />
            <div>
              <p className="text-xs font-bold uppercase text-stone-400">Base</p>
              <p className="text-sm font-semibold text-stone-900">São Paulo, SP — Brasil</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            showToast('Mensagem recebida pela equipe SouNativo!', 'success');
          }}
          className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4 shadow-card"
        >
          <div>
            <label
              htmlFor="contact-name"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Seu nome
            </label>
            <input
              id="contact-name"
              type="text"
              required
              placeholder="Seu nome"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Seu e-mail
            </label>
            <input
              id="contact-email"
              type="email"
              required
              placeholder="Seu e-mail"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-msg"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Mensagem
            </label>
            <textarea
              id="contact-msg"
              rows={4}
              required
              placeholder="Como podemos ajudar?"
              className="w-full rounded-xl border border-stone-300 p-3 text-sm"
            />
          </div>
          <Button type="submit" fullWidth>
            Enviar mensagem
          </Button>
        </form>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => (
  <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-5 text-sm text-stone-700 leading-relaxed">
    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">Termos de Uso</h1>
    <p>
      O SouNativo atua como marketplace intermediador conectando viajantes a agências de viagens e
      guias turísticos independentes credenciados.
    </p>
    <p>
      Cada operadora parceira é integralmente responsável pela execução do roteiro, embarques,
      políticas de cancelamento e cumprimento das normas do Cadastur.
    </p>
  </article>
);

export const PrivacyPage: React.FC = () => (
  <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-5 text-sm text-stone-700 leading-relaxed">
    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
      Política de Privacidade (LGPD)
    </h1>
    <p>
      Coletamos apenas os dados necessários para autenticação via Firebase Auth (Google ou e-mail) e
      para formalização de reservas solicitadas por você junto às agências selecionadas.
    </p>
    <p>
      Seus dados pessoais são protegidos por regras de isolamento no Cloud Firestore e nunca são
      comercializados com terceiros. Contato: privacidade@sounativo.com.
    </p>
  </article>
);
