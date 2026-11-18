import React, { useState } from 'react';
import { Lock, Palette, Upload } from 'lucide-react';
import { Agency, AgencyTheme } from '@/types';
import { updateAgencyThemeInFirestore } from '@/services/agencyService';
import { extractColorsFromImage } from '@/utils/colorExtractor';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PartnerThemeBuilderProps {
  agency: Agency;
  canCustomizeTheme?: boolean;
  onThemeUpdated: (theme: AgencyTheme) => void;
}

export const PartnerThemeBuilder: React.FC<PartnerThemeBuilderProps> = ({
  agency,
  canCustomizeTheme = true,
  onThemeUpdated,
}) => {
  const { showToast } = useToast();
  const initialTheme = agency?.theme;

  const [primaryHex, setPrimaryHex] = useState(initialTheme?.colors?.primary ?? '#0F4C3A');
  const [secondaryHex, setSecondaryHex] = useState(initialTheme?.colors?.secondary ?? '#C66B3D');
  const [fontPair, setFontPair] = useState<AgencyTheme['fontPair']>(
    initialTheme?.fontPair ?? 'classic'
  );
  const [borderRadius, setBorderRadius] = useState<AgencyTheme['borderRadius']>(
    initialTheme?.borderRadius ?? 'soft'
  );
  const [buttonStyle, setButtonStyle] = useState<AgencyTheme['buttonStyle']>(
    initialTheme?.buttonStyle ?? 'solid'
  );
  const [headerStyle, setHeaderStyle] = useState<AgencyTheme['headerStyle']>(
    initialTheme?.headerStyle ?? 'solid'
  );
  const [saving, setSaving] = useState(false);

  const handleExtractFromLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const palette = await extractColorsFromImage(file);
      setPrimaryHex(palette.primary);
      setSecondaryHex(palette.secondary);
      showToast('Paleta sugerida a partir da imagem!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Falha ao ler imagem.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveTheme = async () => {
    if (!canCustomizeTheme) {
      showToast('Personalização whitelabel completa disponível a partir do plano Básico.', 'info');
      return;
    }

    setSaving(true);
    const nextTheme: AgencyTheme = {
      colors: {
        primary: primaryHex,
        secondary: secondaryHex,
        background: '#FAFAF9',
        text: '#1C1917',
      },
      fontPair,
      borderRadius,
      buttonStyle,
      headerStyle,
    };
    try {
      await updateAgencyThemeInFirestore(agency.id, nextTheme);
      onThemeUpdated(nextTheme);
      showToast('Identidade visual do microsite atualizada!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao salvar tema.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Palette size={20} className="text-secondary-600" />
          <h3 className="font-serif text-xl font-bold text-stone-900">Smart Site Builder</h3>
          {!canCustomizeTheme && (
            <Badge tone="neutral">
              <Lock size={11} /> Plano Básico+
            </Badge>
          )}
        </div>

        <label className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer">
          <Upload size={14} />
          Extrair cores da logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void handleExtractFromLogo(e)}
            className="sr-only"
          />
        </label>
      </div>

      <p className="text-xs text-stone-600">
        Personalize cores, tipografia e estilo aplicados dinamicamente em{' '}
        <code>/{agency.slug}</code>.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-xs font-semibold text-stone-700">
          Cor Primária
          <input
            type="color"
            value={primaryHex}
            onChange={(e) => setPrimaryHex(e.target.value)}
            className="mt-1 block h-11 w-full rounded-xl border border-stone-300 cursor-pointer"
          />
        </label>
        <label className="block text-xs font-semibold text-stone-700">
          Cor Secundária
          <input
            type="color"
            value={secondaryHex}
            onChange={(e) => setSecondaryHex(e.target.value)}
            className="mt-1 block h-11 w-full rounded-xl border border-stone-300 cursor-pointer"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="block text-xs font-semibold text-stone-700">
          Tipografia
          <select
            value={fontPair}
            onChange={(e) => setFontPair(e.target.value as AgencyTheme['fontPair'])}
            className="mt-1 w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs"
          >
            <option value="classic">Editorial</option>
            <option value="modern">Moderna</option>
            <option value="playful">Expressiva</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-stone-700">
          Bordas
          <select
            value={borderRadius}
            onChange={(e) => setBorderRadius(e.target.value as AgencyTheme['borderRadius'])}
            className="mt-1 w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs"
          >
            <option value="soft">Suave</option>
            <option value="full">Pílula</option>
            <option value="none">Reto</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-stone-700">
          Botão CTA
          <select
            value={buttonStyle}
            onChange={(e) => setButtonStyle(e.target.value as AgencyTheme['buttonStyle'])}
            className="mt-1 w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs"
          >
            <option value="solid">Sólido</option>
            <option value="outline">Contorno</option>
            <option value="ghost">Translúcido</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-stone-700">
          Cabeçalho
          <select
            value={headerStyle}
            onChange={(e) => setHeaderStyle(e.target.value as AgencyTheme['headerStyle'])}
            className="mt-1 w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs"
          >
            <option value="solid">Sólido</option>
            <option value="transparent">Degradê</option>
          </select>
        </label>
      </div>

      <Button
        variant="outline"
        loading={saving}
        disabled={!canCustomizeTheme}
        onClick={() => void handleSaveTheme()}
      >
        {canCustomizeTheme
          ? 'Salvar identidade do microsite'
          : 'Disponível no Plano Básico ou Premium'}
      </Button>
    </section>
  );
};
