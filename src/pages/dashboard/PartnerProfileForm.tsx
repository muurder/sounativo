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
  const [city, setCity] = useState(agency.city ?? '');
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp ?? '');
  const [cadastur, setCadastur] = useState(agency.cadastur ?? '');
  const [languagesText, setLanguagesText] = useState((agency.languages ?? []).join(', '));
  const [specialtiesText, setSpecialtiesText] = useState((agency.specialties ?? []).join(', '));
  const [experienceYears, setExperienceYears] = useState(String(agency.experienceYears ?? 1));
  const [availability, setAvailability] = useState<GuideDetails['availability']>(
    agency.availability ?? 'ON_DEMAND'
  );
  const [heroTitle, setHeroTitle] = useState(agency.heroTitle ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(agency.heroSubtitle ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updates = {
      name: name.trim(),
      description: description.trim(),
      city: city.trim(),
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
      heroTitle: heroTitle.trim(),
      heroSubtitle: heroSubtitle.trim(),
    };

    try {
      await updateAgencyProfileInFirestore(agency.id, updates);
      onUpdated({ ...agency, ...updates });
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
        Dados do Microsite & Credencial
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
