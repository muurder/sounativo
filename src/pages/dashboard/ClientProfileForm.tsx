import React, { useEffect, useState } from 'react';
import { Award, Briefcase, MapPin, Save, User, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { provisionPartnerAccount } from '@/services/partnerSignupService';
import { formatUserRoleLabel } from '@/utils/dashboardRouting';
import { useToast } from '@/context/ToastContext';
import { UserAddress, UserProfile, UserRole } from '@/types';

interface ClientProfileFormProps {
  profile: UserProfile | null;
  saving: boolean;
  onSave: (
    updates: Partial<
      Pick<
        UserProfile,
        | 'name'
        | 'phone'
        | 'cpf'
        | 'birthDate'
        | 'address'
        | 'notificationsEnabled'
        | 'photoURL'
        | 'role'
      >
    >
  ) => Promise<void>;
}

const ACCOUNT_ROLE_OPTIONS: Array<{
  role: Exclude<UserRole, 'ADMIN'>;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}> = [
  {
    role: 'CLIENT',
    title: 'Viajante / Cliente',
    description: 'Reserve pacotes, gerencie vouchers, favoritos e avalie experiências.',
    icon: User,
  },
  {
    role: 'GUIDE',
    title: 'Guia de Turismo',
    description: 'Publique experiências autorais, exiba seu Cadastur e receba reservas.',
    icon: Award,
  },
  {
    role: 'AGENCY',
    title: 'Agência de Turismo',
    description: 'Gerencie catálogo de pacotes, turmas, embarques, transporte e microsite.',
    icon: Briefcase,
  },
];

export const ClientProfileForm: React.FC<ClientProfileFormProps> = ({
  profile,
  saving,
  onSave,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState(profile?.name ?? '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [cpf, setCpf] = useState(profile?.cpf ?? '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '');
  const [address, setAddress] = useState<UserAddress>({
    zipCode: profile?.address?.zipCode ?? '',
    street: profile?.address?.street ?? '',
    number: profile?.address?.number ?? '',
    complement: profile?.address?.complement ?? '',
    district: profile?.address?.district ?? '',
    city: profile?.address?.city ?? '',
    state: profile?.address?.state ?? '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ?? true
  );
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'ADMIN'>>(
    profile?.role === 'AGENCY' || profile?.role === 'GUIDE' ? profile.role : 'CLIENT'
  );
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhotoURL(profile.photoURL ?? '');
      setPhone(profile.phone ?? '');
      setCpf(profile.cpf ?? '');
      setBirthDate(profile.birthDate ?? '');
      setAddress({
        zipCode: profile.address?.zipCode ?? '',
        street: profile.address?.street ?? '',
        number: profile.address?.number ?? '',
        complement: profile.address?.complement ?? '',
        district: profile.address?.district ?? '',
        city: profile.address?.city ?? '',
        state: profile.address?.state ?? '',
      });
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
      if (profile.role === 'AGENCY' || profile.role === 'GUIDE' || profile.role === 'CLIENT') {
        setSelectedRole(profile.role);
      }
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        name,
        photoURL,
        phone,
        cpf,
        birthDate,
        address,
        notificationsEnabled,
      });
      showToast('Dados do perfil atualizados com sucesso!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar perfil.', 'error');
    }
  };

  const handleRoleChange = async () => {
    if (!profile || selectedRole === profile.role) return;
    setSwitchingRole(true);
    try {
      await onSave({ role: selectedRole });
      if (selectedRole === 'GUIDE' || selectedRole === 'AGENCY') {
        await provisionPartnerAccount({
          profile: { ...profile, name: name || profile.name, role: selectedRole },
          isGuide: selectedRole === 'GUIDE',
          displayName: name || profile.name,
        });
      }
      showToast(
        `Perfil alterado para ${formatUserRoleLabel(selectedRole)}! Redirecionando para o seu novo painel...`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível alterar o tipo de perfil.',
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
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Meus Dados Pessoais &amp; Contato
            </h2>
            <p className="text-xs text-stone-500">
              Seus dados facilitam o preenchimento automático de vouchers e listas de embarque.
            </p>
          </div>
          <Badge tone="primary">{formatUserRoleLabel(profile?.role)}</Badge>
        </div>

        <ImageUploadField
          id="prof-avatar"
          label="Foto de perfil"
          scope="avatar"
          previewShape="square"
          value={photoURL}
          onChange={setPhotoURL}
          helperText="Envie sua foto (JPG, PNG ou WebP). Ela será exibida no seu painel e nas avaliações."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="prof-name" className="block text-xs font-semibold text-stone-700 mb-1">
              Nome completo
            </label>
            <input
              id="prof-name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-phone" className="block text-xs font-semibold text-stone-700 mb-1">
              WhatsApp / Telefone
            </label>
            <input
              id="prof-phone"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-cpf" className="block text-xs font-semibold text-stone-700 mb-1">
              CPF (para manifesto de embarque)
            </label>
            <input
              id="prof-cpf"
              maxLength={20}
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-birth" className="block text-xs font-semibold text-stone-700 mb-1">
              Data de Nascimento
            </label>
            <input
              id="prof-birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
            />
          </div>

          <div>
            <label htmlFor="prof-email-ro" className="block text-xs font-semibold text-stone-700 mb-1">
              E-mail da conta
            </label>
            <input
              id="prof-email-ro"
              type="email"
              disabled
              value={profile?.email ?? ''}
              className="w-full min-h-[44px] rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-500"
            />
          </div>
        </div>

        {/* Complete Address Block (Restored from earlier commits) */}
        <div className="pt-4 border-t border-stone-100 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary-600" />
            <h3 className="text-sm font-bold text-stone-900">Endereço Residencial</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="addr-zip" className="block text-xs font-semibold text-stone-700 mb-1">
                CEP
              </label>
              <input
                id="addr-zip"
                maxLength={15}
                value={address.zipCode ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
                placeholder="00000-000"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="addr-street" className="block text-xs font-semibold text-stone-700 mb-1">
                Rua / Logradouro
              </label>
              <input
                id="addr-street"
                maxLength={140}
                value={address.street ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="Av. Paulista"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="addr-num" className="block text-xs font-semibold text-stone-700 mb-1">
                Número
              </label>
              <input
                id="addr-num"
                maxLength={20}
                value={address.number ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, number: e.target.value }))}
                placeholder="1000"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr-comp" className="block text-xs font-semibold text-stone-700 mb-1">
                Complemento
              </label>
              <input
                id="addr-comp"
                maxLength={60}
                value={address.complement ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, complement: e.target.value }))}
                placeholder="Apto 42"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr-dist" className="block text-xs font-semibold text-stone-700 mb-1">
                Bairro
              </label>
              <input
                id="addr-dist"
                maxLength={60}
                value={address.district ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, district: e.target.value }))}
                placeholder="Centro"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="addr-city" className="block text-xs font-semibold text-stone-700 mb-1">
                Cidade
              </label>
              <input
                id="addr-city"
                maxLength={60}
                value={address.city ?? ''}
                onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="São Paulo"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm"
              />
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="addr-uf" className="block text-xs font-semibold text-stone-700 mb-1">
                UF
              </label>
              <input
                id="addr-uf"
                maxLength={2}
                value={address.state ?? ''}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, state: e.target.value.toUpperCase() }))
                }
                placeholder="SP"
                className="w-full min-h-[42px] rounded-xl border border-stone-300 px-3 text-sm uppercase"
              />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-stone-700 pt-2">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-primary-600"
          />
          Receber atualizações de reservas, vouchers e curadorias SouNativo
        </label>

        <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
          Salvar alterações do perfil
        </Button>
      </form>

      {/* Registered Account Role Option inside Profile Settings */}
      {profile?.role !== 'ADMIN' && (
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
                Seu painel abre diretamente de acordo com o perfil escolhido no cadastro. Caso queira
                atuar como Guia de Turismo ou Agência Parceira (ou voltar ao perfil de Viajante),
                altere abaixo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ACCOUNT_ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;
              const isCurrent = profile?.role === opt.role;
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
                  <p className="text-xs text-stone-600 leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>

          {selectedRole !== profile?.role && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-4">
              <p className="text-xs text-primary-950">
                Confirmar mudança do seu perfil cadastrado para{' '}
                <strong>{formatUserRoleLabel(selectedRole)}</strong>? Seu painel será atualizado
                imediatamente.
              </p>
              <Button
                size="sm"
                loading={switchingRole}
                onClick={() => void handleRoleChange()}
              >
                Confirmar troca para {formatUserRoleLabel(selectedRole)}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
