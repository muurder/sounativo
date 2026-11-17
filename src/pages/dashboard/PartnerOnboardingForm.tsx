import React, { useState } from 'react';
import { createAgencyInFirestore } from '@/services/agencyService';
import { Agency, UserProfile } from '@/types';
import { isValidSlug, slugify } from '@/utils/slugUtils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PartnerOnboardingFormProps {
  profile: UserProfile;
  onUpdateProfile: (updates: { agencyId: string; role: 'AGENCY' | 'GUIDE' }) => Promise<void>;
  onCreated: (agency: Agency) => void;
}

export const PartnerOnboardingForm: React.FC<PartnerOnboardingFormProps> = ({
  profile,
  onUpdateProfile,
  onCreated,
}) => {
  const { showToast } = useToast();
  const [orgName, setOrgName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isGuide, setIsGuide] = useState(profile.role === 'GUIDE');
  const [cadastur, setCadastur] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  const baseSlug = slugify(customSlug || orgName);
  const uidSuffix = profile.uid.slice(0, 4).toLowerCase();
  const previewSlug = `${baseSlug || 'parceiro'}-${uidSuffix}`;
  const validPhotoLogo =
    profile.photoURL && /^https?:\/\//i.test(profile.photoURL)
      ? profile.photoURL
      : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSlug(previewSlug)) {
      showToast('O identificador do microsite deve usar apenas letras e hífens.', 'error');
      return;
    }

    setCreatingOrg(true);
    try {
      const created = await createAgencyInFirestore({
        ownerUid: profile.uid,
        name: orgName.trim(),
        slug: previewSlug,
        description: isGuide
          ? 'Guia local credenciado pelo SouNativo.'
          : 'Agência parceira curada pelo SouNativo.',
        logo: validPhotoLogo,
        whatsapp: whatsapp.trim(),
        city: city.trim(),
        state: 'BR',
        isGuide,
        cadastur: isGuide ? cadastur.trim() : '',
        heroMode: 'TRIPS',
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'ACTIVE',
        isActive: true,
      });

      await onUpdateProfile({
        agencyId: created.id,
        role: isGuide ? 'GUIDE' : 'AGENCY',
      });

      onCreated(created);
      showToast('Microsite de parceiro criado no Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar perfil parceiro.', 'error');
    } finally {
      setCreatingOrg(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4"
    >
      <Badge tone="secondary">Onboarding de Parceiro</Badge>
      <h2 className="font-serif text-2xl font-bold text-stone-900">
        Ative sua Agência ou Perfil de Guia
      </h2>
      <p className="text-sm text-stone-600">
        Publique roteiros, receba reservas e tenha seu microsite exclusivo em{' '}
        <code>
          {typeof window !== 'undefined' ? window.location.host : 'sounativo.vercel.app'}/
          {previewSlug}
        </code>
        .
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsGuide(false)}
          className={`flex-1 min-h-[44px] rounded-xl border text-sm font-semibold ${
            !isGuide ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200'
          }`}
        >
          Agência de Viagens
        </button>
        <button
          type="button"
          onClick={() => setIsGuide(true)}
          className={`flex-1 min-h-[44px] rounded-xl border text-sm font-semibold ${
            isGuide ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-stone-200'
          }`}
        >
          Guia / Agente
        </button>
      </div>

      <div>
        <label
          htmlFor="partner-org-name"
          className="block text-xs font-semibold text-stone-700 mb-1"
        >
          {isGuide ? 'Nome profissional' : 'Nome da agência'}
        </label>
        <input
          id="partner-org-name"
          required
          minLength={2}
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder={isGuide ? 'Seu nome profissional' : 'Nome da agência'}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor="partner-slug" className="block text-xs font-semibold text-stone-700 mb-1">
          URL desejada (slug)
        </label>
        <input
          id="partner-slug"
          value={customSlug}
          onChange={(e) => setCustomSlug(e.target.value)}
          placeholder={slugify(orgName) || 'minha-agencia'}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="partner-city" className="block text-xs font-semibold text-stone-700 mb-1">
            Cidade base
          </label>
          <input
            id="partner-city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cidade base (ex: Paraty)"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="partner-whatsapp"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            WhatsApp com DDD
          </label>
          <input
            id="partner-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="5511999999999"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      {isGuide && (
        <div>
          <label
            htmlFor="partner-cadastur"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            Número Cadastur
          </label>
          <input
            id="partner-cadastur"
            value={cadastur}
            onChange={(e) => setCadastur(e.target.value)}
            placeholder="Número Cadastur (opcional)"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      )}

      <Button type="submit" loading={creatingOrg}>
        Criar meu microsite grátis
      </Button>
    </form>
  );
};
