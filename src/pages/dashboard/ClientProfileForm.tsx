import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useToast } from '@/context/ToastContext';
import { UserProfile } from '@/types';

interface ClientProfileFormProps {
  profile: UserProfile | null;
  saving: boolean;
  onSave: (
    updates: Partial<
      Pick<
        UserProfile,
        'name' | 'phone' | 'cpf' | 'birthDate' | 'notificationsEnabled' | 'photoURL'
      >
    >
  ) => Promise<void>;
}

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationsEnabled ?? true
  );

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setPhotoURL(profile.photoURL ?? '');
      setPhone(profile.phone ?? '');
      setCpf(profile.cpf ?? '');
      setBirthDate(profile.birthDate ?? '');
      setNotificationsEnabled(profile.notificationsEnabled ?? true);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({ name, photoURL, phone, cpf, birthDate, notificationsEnabled });
      showToast('Perfil sincronizado no Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar perfil.', 'error');
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4"
    >
      <h2 className="font-serif text-xl font-bold text-stone-900">Dados do Viajante</h2>
      <p className="text-xs text-stone-500">
        Sincronizado em tempo real com <code>users/{profile?.uid}</code> no Cloud Firestore.
      </p>

      <ImageUploadField
        id="prof-avatar"
        label="Foto de perfil"
        scope="avatar"
        previewShape="square"
        value={photoURL}
        onChange={setPhotoURL}
        helperText="Envie sua foto (JPG, PNG ou WebP). Ela será exibida no cabeçalho e nas suas avaliações."
      />

      <div>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            CPF
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
            Nascimento
          </label>
          <input
            id="prof-birth"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-stone-700 pt-1">
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => setNotificationsEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-primary-600"
        />
        Receber atualizações de reservas e curadorias SouNativo
      </label>

      <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
        Salvar alterações
      </Button>
    </form>
  );
};
