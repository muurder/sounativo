import React from 'react';
import { Globe, Mail, MapPin, ShieldCheck, Users } from 'lucide-react';
import { ContactForm } from '@/components/institutional/ContactForm';
import { usePageMeta } from '@/hooks/usePageMeta';

export const AboutPage: React.FC = () => {
  usePageMeta({
    title: 'Sobre o SouNativo',
    description:
      'Conheça nossa missão de conectar viajantes a agências verificadas e guias locais em todo o Brasil.',
    canonicalPath: '/about',
  });

  return (
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
};

export const ContactPage: React.FC = () => {
  usePageMeta({
    title: 'Fale com o SouNativo',
    description: 'Suporte a viajantes, onboarding de agências e parcerias regionais.',
    canonicalPath: '/contact',
  });

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

        <ContactForm />
      </div>
    </div>
  );
};

export { TermsOfServicePage as TermsPage } from '@/pages/legal/TermsOfServicePage';
export { PrivacyPolicyPage as PrivacyPage } from '@/pages/legal/PrivacyPolicyPage';
export { CookiePolicyPage } from '@/pages/legal/CookiePolicyPage';
