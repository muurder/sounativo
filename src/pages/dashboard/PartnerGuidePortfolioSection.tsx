import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  Briefcase,
  CheckCircle2,
  Compass,
  Globe,
  MapPin,
  MessageCircle,
  Save,
} from 'lucide-react';
import { Agency, GuideDetails } from '@/types';
import { updateAgencyProfileInFirestore } from '@/services/agencyService';
import { useAgencies } from '@/hooks/useAgencies';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { SafeImage } from '@/components/ui/SafeImage';
import { buildAgencyWhatsAppLink } from '@/utils/whatsapp';
import { useToast } from '@/context/ToastContext';

const PRESET_LANGUAGES = [
  'Português',
  'Inglês',
  'Espanhol',
  'LIBRAS',
  'Francês',
  'Italiano',
  'Alemão',
];

const PRESET_SPECIALTIES = [
  'Ecoturismo',
  'Trilhas & Montanhismo',
  'Cultural & Histórico',
  'Gastronômico',
  'Observação de Fauna',
  'Fotográfico',
  'Cicloturismo',
  'City Tour',
  'Aventura & Cachoeiras',
  'Comunidades Tradicionais',
];

interface PartnerGuidePortfolioSectionProps {
  agency: Agency;
  mode: 'portfolio' | 'opportunities';
  onUpdated: (updated: Agency) => void;
}

export const PartnerGuidePortfolioSection: React.FC<PartnerGuidePortfolioSectionProps> = ({
  agency,
  mode,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const { agencies: partnerAgencies } = useAgencies(false);

  const [bio, setBio] = useState(agency.description ?? '');
  const [cadastur, setCadastur] = useState(agency.cadastur ?? '');
  const [city, setCity] = useState(agency.city ?? '');
  const [stateUf, setStateUf] = useState(agency.state ?? 'SP');
  const [experienceYears, setExperienceYears] = useState(String(agency.experienceYears ?? 1));
  const [availability, setAvailability] = useState<GuideDetails['availability']>(
    agency.availability ?? 'ON_DEMAND'
  );
  const [languages, setLanguages] = useState<string[]>(
    Array.isArray(agency.languages) && agency.languages.length > 0
      ? agency.languages
      : ['Português']
  );
  const [specialties, setSpecialties] = useState<string[]>(
    Array.isArray(agency.specialties) ? agency.specialties : []
  );
  const [logo, setLogo] = useState(agency.logo ?? '');
  const [heroBannerUrl, setHeroBannerUrl] = useState(agency.heroBannerUrl ?? '');
  const [saving, setSaving] = useState(false);

  const toggleItem = (list: string[], value: string, setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const parsedExp = Number(experienceYears);
    const safeExp = Number.isFinite(parsedExp) ? Math.min(100, Math.max(0, parsedExp)) : 1;

    const updates = {
      description: bio.trim(),
      cadastur: cadastur.trim(),
      city: city.trim(),
      state: stateUf.trim().toUpperCase() || 'BR',
      experienceYears: safeExp,
      availability,
      languages: languages.length > 0 ? languages : ['Português'],
      specialties,
      ...(logo.trim() ? { logo: logo.trim() } : {}),
      ...(heroBannerUrl.trim()
        ? { heroBannerUrl: heroBannerUrl.trim(), heroMode: 'STATIC' as const }
        : {}),
    };

    try {
      await updateAgencyProfileInFirestore(agency.id, updates);
      onUpdated({ ...agency, ...updates });
      showToast('Portfólio e credencial do Guia atualizados!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar portfólio.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (mode === 'opportunities') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-primary-600" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Mural de Oportunidades &amp; Agências Parceiras
            </h2>
          </div>
          <p className="text-xs text-stone-600">
            Agências verificadas no SouNativo buscam guias locais credenciados no diretório
            &ldquo;Contratar Guias&rdquo;. Mantenha seu Cadastur e idiomas atualizados ou apresente
            seu portfólio diretamente às operadoras abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerAgencies.map((partner) => {
            const phone = partner.whatsapp || partner.phone;
            const waUrl = phone
              ? buildAgencyWhatsAppLink(
                  phone,
                  `Olá ${partner.name}! Sou ${agency.name}, Guia de Turismo no SouNativo (${window.location.origin}/${agency.slug}), e gostaria de apresentar meu portfólio para parcerias operacionais.`
                )
              : null;

            return (
              <div
                key={partner.id}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <SafeImage
                      src={partner.logo}
                      alt={partner.name}
                      className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-serif text-base font-bold text-stone-900 truncate">
                        {partner.name}
                      </h3>
                      <p className="inline-flex items-center gap-1 text-xs text-stone-500">
                        <MapPin size={12} className="text-primary-600" />
                        {partner.city
                          ? `${partner.city}, ${partner.state || 'BR'}`
                          : partner.state || 'Brasil'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {partner.description || 'Agência de receptivo e expedições no SouNativo.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <Link
                    to={`/${partner.slug}`}
                    className="flex-1 text-center rounded-xl border border-stone-200 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    Ver Agência
                  </Link>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <MessageCircle size={13} /> Apresentar-se
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSavePortfolio(e)} className="space-y-6">
      {/* Guide Tip Banner (Restored from GuideDashboard) */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3 text-blue-950">
        <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-bold">Destaque sua credencial e idiomas no diretório de Guias Locais!</p>
          <p className="text-blue-900/90">
            Guias com foto profissional, número Cadastur preenchido e especialidades marcadas
            aparecem em destaque para viajantes e para agências na aba &ldquo;Contratar Guias&rdquo;.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Meu Portfólio &amp; Credencial de Guia
            </h2>
            <p className="text-xs text-stone-500">
              Personalize sua apresentação pública em <code>/{agency.slug}</code> e em{' '}
              <code>/guides</code>.
            </p>
          </div>
          {cadastur ? (
            <Badge tone="success">
              <CheckCircle2 size={12} /> Cadastur {cadastur}
            </Badge>
          ) : (
            <Badge tone="warning">Cadastur pendente</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ImageUploadField
            id="guide-avatar-upload"
            label="Foto profissional do Guia"
            scope="branding"
            previewShape="square"
            value={logo}
            onChange={setLogo}
          />
          <ImageUploadField
            id="guide-cover-upload"
            label="Foto de capa do seu portfólio / microsite"
            scope="banners"
            previewShape="wide"
            value={heroBannerUrl}
            onChange={setHeroBannerUrl}
          />
        </div>

        {/* Bio / Sua História */}
        <div>
          <label htmlFor="guide-bio" className="block text-xs font-semibold text-stone-700 mb-1">
            Sua História &amp; Experiência em Campo (Bio)
          </label>
          <textarea
            id="guide-bio"
            rows={4}
            maxLength={5000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte sua trajetória no turismo, certificações em primeiros socorros, biomas que domina e o que torna suas experiências únicas..."
            className="w-full rounded-xl border border-stone-300 p-3.5 text-sm"
          />
          <p className="text-[11px] text-stone-400 mt-1 text-right">
            {bio.length} caracteres (recomendado: mínimo 100 caracteres)
          </p>
        </div>

        {/* Credencial, Cidade, UF, Experiência e Disponibilidade */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label
              htmlFor="guide-cadastur"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Número do Cadastur
            </label>
            <input
              id="guide-cadastur"
              value={cadastur}
              onChange={(e) => setCadastur(e.target.value)}
              placeholder="Ex: 27.019283.96-0"
              className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="guide-city" className="block text-xs font-semibold text-stone-700 mb-1">
              Cidade Base
            </label>
            <input
              id="guide-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lençóis"
              className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="guide-uf" className="block text-xs font-semibold text-stone-700 mb-1">
              UF
            </label>
            <input
              id="guide-uf"
              maxLength={2}
              value={stateUf}
              onChange={(e) => setStateUf(e.target.value.toUpperCase())}
              placeholder="BA"
              className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm uppercase"
            />
          </div>

          <div>
            <label htmlFor="guide-exp" className="block text-xs font-semibold text-stone-700 mb-1">
              Anos de atuação
            </label>
            <input
              id="guide-exp"
              type="number"
              min="0"
              max="80"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
        </div>

        {/* Interactive Languages & Specialties Tags (Restored from GuideDashboard) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Globe size={15} className="text-primary-600" /> Idiomas de Guiamento
            </p>
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3.5">
              {PRESET_LANGUAGES.map((lang) => {
                const active = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleItem(languages, lang, setLanguages)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white border border-stone-200 text-stone-700 hover:border-primary-400'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-xs text-stone-700 pt-1">
              <input
                type="checkbox"
                checked={languages.includes('LIBRAS')}
                onChange={(e) => {
                  if (e.target.checked && !languages.includes('LIBRAS')) {
                    setLanguages([...languages, 'LIBRAS']);
                  } else if (!e.target.checked) {
                    setLanguages(languages.filter((l) => l !== 'LIBRAS'));
                  }
                }}
                className="h-4 w-4 rounded border-stone-300 text-primary-600"
              />
              Atendimento acessível em LIBRAS (Língua Brasileira de Sinais)
            </label>
          </div>

          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Compass size={15} className="text-primary-600" /> Especialidades &amp; Biomas
            </p>
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3.5">
              {PRESET_SPECIALTIES.map((spec) => {
                const active = specialties.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleItem(specialties, spec, setSpecialties)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-stone-200 text-stone-700 hover:border-emerald-400'
                    }`}
                  >
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <Award size={18} className="text-primary-600" />
            <div className="text-xs">
              <span className="font-semibold text-stone-700 mr-2">Disponibilidade na agenda:</span>
              <select
                aria-label="Disponibilidade na agenda"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as GuideDetails['availability'])}
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="FULL_TIME">Tempo integral</option>
                <option value="PART_TIME">Fins de semana / Feriados</option>
                <option value="ON_DEMAND">Sob demanda / Grupos privados</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
            Salvar Portfólio do Guia
          </Button>
        </div>
      </div>
    </form>
  );
};
