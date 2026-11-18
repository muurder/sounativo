import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Agency, GuideDetails } from '@/types';
import { updateAgencyProfileInFirestore } from '@/services/agencyService';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { PartnerGuideFields } from './PartnerGuideFields';

interface PartnerProfileFormProps {
  agency: Agency;
  onUpdated: (agency: Agency) => void;
}

export const PartnerProfileForm: React.FC<PartnerProfileFormProps> = ({ agency, onUpdated }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(agency.name);
  const [description, setDescription] = useState(agency.description);
  const [logo, setLogo] = useState(agency.logo ?? '');
  const [email, setEmail] = useState(agency.email ?? '');
  const [website, setWebsite] = useState(agency.website ?? '');
  const [city, setCity] = useState(agency.city ?? '');
  const [stateUf, setStateUf] = useState(agency.state ?? 'BR');
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp ?? '');
  const [cadastur, setCadastur] = useState(agency.cadastur ?? '');
  const [languagesText, setLanguagesText] = useState((agency.languages ?? []).join(', '));
  const [specialtiesText, setSpecialtiesText] = useState((agency.specialties ?? []).join(', '));
  const [experienceYears, setExperienceYears] = useState(String(agency.experienceYears ?? 1));
  const [availability, setAvailability] = useState<GuideDetails['availability']>(
    agency.availability ?? 'ON_DEMAND'
  );
  const [heroMode, setHeroMode] = useState<'TRIPS' | 'STATIC'>(agency.heroMode ?? 'TRIPS');
  const [heroBannerUrl, setHeroBannerUrl] = useState(agency.heroBannerUrl ?? '');
  const [heroTitle, setHeroTitle] = useState(agency.heroTitle ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(agency.heroSubtitle ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updates = {
      name: name.trim(),
      description: description.trim(),
      logo: logo.trim(),
      email: email.trim(),
      website: website.trim(),
      city: city.trim(),
      state: stateUf.trim().toUpperCase(),
      whatsapp: whatsapp.trim(),
      cadastur: cadastur.trim(),
      languages: languagesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      specialties: specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      experienceYears: Math.max(0, Number(experienceYears)),
      availability,
      heroMode,
      heroBannerUrl: heroBannerUrl.trim(),
      heroTitle: heroTitle.trim(),
      heroSubtitle: heroSubtitle.trim(),
    };

    try {
      await updateAgencyProfileInFirestore(agency.id, updates);
      onUpdated({ ...agency, ...updates, logo: updates.logo || agency.logo });
      showToast('Dados públicos do parceiro atualizados!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4"
    >
      <h3 className="font-serif text-xl font-bold text-stone-900">
        Dados do Microsite &amp; Credencial
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="ag-name" className="block text-xs font-semibold text-stone-700 mb-1">
            Nome de exibição
          </label>
          <input
            id="ag-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-whatsapp" className="block text-xs font-semibold text-stone-700 mb-1">
            WhatsApp oficial
          </label>
          <input
            id="ag-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="5511999999999"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-email" className="block text-xs font-semibold text-stone-700 mb-1">
            E-mail comercial
          </label>
          <input
            id="ag-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@agencia.com.br"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="ag-logo" className="block text-xs font-semibold text-stone-700 mb-1">
            URL da Logo / Avatar
          </label>
          <input
            id="ag-logo"
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-website" className="block text-xs font-semibold text-stone-700 mb-1">
            Site oficial / Instagram
          </label>
          <input
            id="ag-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-state" className="block text-xs font-semibold text-stone-700 mb-1">
            Estado (UF)
          </label>
          <input
            id="ag-state"
            maxLength={50}
            value={stateUf}
            onChange={(e) => setStateUf(e.target.value)}
            placeholder="SP, BA, RJ..."
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      <PartnerGuideFields
        city={city}
        cadastur={cadastur}
        availability={availability}
        languagesText={languagesText}
        specialtiesText={specialtiesText}
        experienceYears={experienceYears}
        onCityChange={setCity}
        onCadasturChange={setCadastur}
        onAvailabilityChange={setAvailability}
        onLanguagesChange={setLanguagesText}
        onSpecialtiesChange={setSpecialtiesText}
        onExperienceChange={setExperienceYears}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ag-hero-mode" className="block text-xs font-semibold text-stone-700 mb-1">
            Modo da Capa do Microsite
          </label>
          <select
            id="ag-hero-mode"
            value={heroMode}
            onChange={(e) => setHeroMode(e.target.value as 'TRIPS' | 'STATIC')}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="TRIPS">Catálogo em destaque (TRIPS)</option>
            <option value="STATIC">Banner institucional (STATIC)</option>
          </select>
        </div>
        <div>
          <label htmlFor="ag-banner" className="block text-xs font-semibold text-stone-700 mb-1">
            URL do Banner de Capa
          </label>
          <input
            id="ag-banner"
            type="url"
            value={heroBannerUrl}
            onChange={(e) => setHeroBannerUrl(e.target.value)}
            placeholder="https://..."
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ag-hero-t" className="block text-xs font-semibold text-stone-700 mb-1">
            Título da capa do microsite
          </label>
          <input
            id="ag-hero-t"
            maxLength={150}
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-hero-s" className="block text-xs font-semibold text-stone-700 mb-1">
            Subtítulo da capa
          </label>
          <input
            id="ag-hero-s"
            maxLength={300}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ag-desc" className="block text-xs font-semibold text-stone-700 mb-1">
          Descrição da agência / bio
        </label>
        <textarea
          id="ag-desc"
          rows={3}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
      </div>

      <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
        Atualizar perfil público
      </Button>
    </form>
  );
};
