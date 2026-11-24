import React, { useState } from 'react';
import { Award, Briefcase, Save, User, UserCog } from 'lucide-react';
import { Agency, GuideDetails, UserRole } from '@/types';
import { updateAgencyProfileInFirestore } from '@/services/agencyService';
import { formatUserRoleLabel } from '@/utils/dashboardRouting';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useToast } from '@/context/ToastContext';
import { PartnerGuideFields } from './PartnerGuideFields';

interface PartnerProfileFormProps {
  agency: Agency;
  currentRole?: UserRole;
  onChangeRole?: (nextRole: Exclude<UserRole, 'ADMIN'>) => Promise<void>;
  onUpdated: (agency: Agency) => void;
}

export const PartnerProfileForm: React.FC<PartnerProfileFormProps> = ({
  agency,
  currentRole,
  onChangeRole,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const effectiveRole: Exclude<UserRole, 'ADMIN'> =
    currentRole === 'GUIDE' || currentRole === 'AGENCY' || currentRole === 'CLIENT'
      ? currentRole
      : agency.isGuide
        ? 'GUIDE'
        : 'AGENCY';
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'ADMIN'>>(effectiveRole);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [name, setName] = useState(agency.name ?? '');
  const [description, setDescription] = useState(agency.description ?? '');
  const [city, setCity] = useState(agency.city ?? '');
  const [stateUf, setStateUf] = useState(agency.state ?? 'SP');
  const [whatsapp, setWhatsapp] = useState(agency.whatsapp ?? '');
  const [email, setEmail] = useState(agency.email ?? '');
  const [cnpj, setCnpj] = useState(agency.cnpj ?? '');
  const [logo, setLogo] = useState(agency.logo ?? '');
  const [cadastur, setCadastur] = useState(agency.cadastur ?? '');
  const [languagesText, setLanguagesText] = useState((agency.languages ?? []).join(', '));
  const [specialtiesText, setSpecialtiesText] = useState((agency.specialties ?? []).join(', '));
  const [experienceYears, setExperienceYears] = useState(String(agency.experienceYears ?? 1));
  const [availability, setAvailability] = useState<GuideDetails['availability']>(
    agency.availability ?? 'ON_DEMAND'
  );
  const [heroMode, setHeroMode] = useState<Agency['heroMode']>(agency.heroMode ?? 'TRIPS');
  const [heroBannerUrl, setHeroBannerUrl] = useState(agency.heroBannerUrl ?? '');
  const [heroTitle, setHeroTitle] = useState(agency.heroTitle ?? '');
  const [heroSubtitle, setHeroSubtitle] = useState(agency.heroSubtitle ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const parsedExp = Number(experienceYears);
    const safeExp = Number.isFinite(parsedExp) ? Math.min(100, Math.max(0, parsedExp)) : 0;

    const updates = {
      name: name.trim(),
      description: description.trim(),
      city: city.trim(),
      state: stateUf.trim().toUpperCase() || 'BR',
      whatsapp: whatsapp.trim(),
      email: email.trim().toLowerCase(),
      ...(!agency.isGuide ? { cnpj: cnpj.trim() } : {}),
      ...(logo.trim() ? { logo: logo.trim() } : {}),
      cadastur: cadastur.trim(),
      languages: languagesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20),
      specialties: specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20),
      experienceYears: safeExp,
      availability,
      heroMode,
      heroBannerUrl: heroBannerUrl.trim(),
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

  const handleRoleSwitch = async () => {
    if (!onChangeRole || selectedRole === effectiveRole) return;
    setSwitchingRole(true);
    try {
      await onChangeRole(selectedRole);
      showToast(
        `Perfil cadastrado alterado para ${formatUserRoleLabel(selectedRole)}!`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao alterar tipo de perfil cadastrado.',
        'error'
      );
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Dados {agency.isGuide ? 'do Guia & Microsite' : 'da Agência & Credencial'}
          </h3>
          <Badge tone="primary">{formatUserRoleLabel(effectiveRole)}</Badge>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ImageUploadField
          id="ag-logo-upload"
          label={agency.isGuide ? 'Foto profissional' : 'Logo da agência'}
          scope="branding"
          previewShape="square"
          value={logo}
          onChange={setLogo}
        />

        <ImageUploadField
          id="ag-banner-upload"
          label="Banner fotográfico da capa (microsite)"
          scope="banners"
          previewShape="wide"
          value={heroBannerUrl}
          onChange={(nextUrl) => {
            setHeroBannerUrl(nextUrl);
            if (nextUrl) setHeroMode('STATIC');
          }}
          helperText="Ao enviar uma capa, o microsite ativa automaticamente o modo Banner Fotográfico."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="ag-name" className="block text-xs font-semibold text-stone-700 mb-1">
            Nome de exibição
          </label>
          <input
            id="ag-name"
            required
            minLength={2}
            maxLength={120}
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
            maxLength={30}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ag-uf" className="block text-xs font-semibold text-stone-700 mb-1">
            Estado (UF)
          </label>
          <input
            id="ag-uf"
            maxLength={2}
            value={stateUf}
            onChange={(e) => setStateUf(e.target.value.toUpperCase())}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm uppercase"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ag-email" className="block text-xs font-semibold text-stone-700 mb-1">
            E-mail operacional (notificações de reservas)
          </label>
          <input
            id="ag-email"
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="reservas@suaagencia.com.br"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        {!agency.isGuide && (
          <div>
            <label htmlFor="ag-cnpj" className="block text-xs font-semibold text-stone-700 mb-1">
              CNPJ da Agência
            </label>
            <input
              id="ag-cnpj"
              maxLength={25}
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>
        )}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="ag-hero-mode" className="block text-xs font-semibold text-stone-700 mb-1">
            Estilo da Capa
          </label>
          <select
            id="ag-hero-mode"
            value={heroMode}
            onChange={(e) => setHeroMode(e.target.value as Agency['heroMode'])}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
          >
            <option value="TRIPS">Cor da marca / Institucional</option>
            <option value="STATIC">Banner fotográfico personalizado</option>
          </select>
        </div>
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
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
      </div>

        <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
          Atualizar perfil público
        </Button>
      </form>

      {onChangeRole && currentRole !== 'ADMIN' && (
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <UserCog size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Tipo de Perfil Cadastrado
              </h3>
              <p className="text-xs text-stone-600">
                Altere aqui caso queira mudar sua conta entre Guia de Turismo, Agência de Turismo ou
                Viajante.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                role: 'GUIDE' as const,
                title: 'Guia de Turismo',
                desc: 'Painel de Guia com experiências autorais, portfólio Cadastur e mural de oportunidades.',
                icon: Award,
              },
              {
                role: 'AGENCY' as const,
                title: 'Agência de Turismo',
                desc: 'Painel de Agência com catálogo de pacotes, operacional e contratação de guias.',
                icon: Briefcase,
              },
              {
                role: 'CLIENT' as const,
                title: 'Viajante / Cliente',
                desc: 'Painel de Viajante focado nas suas próprias reservas, vouchers e favoritos.',
                icon: User,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;
              const isCurrent = effectiveRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`text-left rounded-xl border p-4 transition-all space-y-1.5 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-500/20'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-stone-900">
                      <Icon size={16} className="text-primary-600" />
                      {opt.title}
                    </span>
                    {isCurrent && <Badge tone="success">Atual</Badge>}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {selectedRole !== effectiveRole && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-4">
              <p className="text-xs text-primary-950">
                Confirmar alteração do seu perfil cadastrado para{' '}
                <strong>{formatUserRoleLabel(selectedRole)}</strong>?
              </p>
              <Button size="sm" loading={switchingRole} onClick={() => void handleRoleSwitch()}>
                Confirmar troca para {formatUserRoleLabel(selectedRole)}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
