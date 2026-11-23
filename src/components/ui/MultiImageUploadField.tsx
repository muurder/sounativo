import React, { useId, useRef, useState } from 'react';
import { AlertCircle, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { StorageMediaScope, uploadImageToStorage } from '@/services/storageService';
import { SafeImage } from './SafeImage';
import { useToast } from '@/context/ToastContext';

interface MultiImageUploadFieldProps {
  id?: string;
  label: string;
  scope: StorageMediaScope;
  urls: string[];
  maxImages?: number;
  onChange: (nextUrls: string[]) => void;
}

export const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
  id,
  label,
  scope,
  urls,
  maxImages = 12,
  onChange,
}) => {
  const generatedId = useId();
  const inputId = id ?? `multi-upload-${generatedId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const safeUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const remainingSlots = Math.max(0, maxImages - safeUrls.length);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    if (remainingSlots <= 0) {
      showToast(`Limite máximo de ${maxImages} fotos na galeria atingido.`, 'info');
      return;
    }

    const selected = Array.from(fileList).slice(0, remainingSlots);
    setErrorMsg(null);
    setUploading(true);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const currentFile = selected[i];
        setStatusLabel(`Enviando ${i + 1}/${selected.length}...`);
        const res = await uploadImageToStorage(currentFile, scope, (pct) => {
          setStatusLabel(`Foto ${i + 1}/${selected.length} (${pct}%)`);
        });
        uploadedUrls.push(res.downloadUrl);
      }

      if (uploadedUrls.length > 0) {
        onChange([...safeUrls, ...uploadedUrls]);
        showToast(`${uploadedUrls.length} foto(s) adicionada(s) à galeria!`, 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar fotos da galeria.';
      setErrorMsg(message);
      if (uploadedUrls.length > 0) {
        onChange([...safeUrls, ...uploadedUrls]);
      }
      showToast(message, 'error');
    } finally {
      setUploading(false);
      setStatusLabel('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddManualUrl = () => {
    const clean = manualUrl.trim();
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean)) {
      setErrorMsg('Informe uma URL iniciando com http:// ou https://.');
      return;
    }
    if (safeUrls.length >= maxImages) {
      showToast(`Limite de ${maxImages} imagens atingido.`, 'info');
      return;
    }
    setErrorMsg(null);
    onChange([...safeUrls, clean]);
    setManualUrl('');
  };

  const handleRemoveIndex = (idxToRemove: number) => {
    onChange(safeUrls.filter((_, idx) => idx !== idxToRemove));
  };

  return (
    <div className="rounded-xl border border-stone-200 p-3.5 space-y-3 bg-stone-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-semibold text-stone-700">
          {label} ({safeUrls.length}/{maxImages})
        </label>

        <button
          type="button"
          disabled={uploading || remainingSlots <= 0}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl bg-white border border-stone-300 px-3 text-xs font-semibold text-stone-800 hover:border-primary-500 hover:text-primary-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin text-primary-600" />
              {statusLabel || 'Enviando...'}
            </>
          ) : (
            <>
              <UploadCloud size={14} className="text-primary-600" />
              Enviar fotos extras
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(e) => void handleFiles(e.target.files)}
          className="sr-only"
        />
      </div>

      {safeUrls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {safeUrls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              <SafeImage
                src={url}
                alt={`Foto extra ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label={`Remover foto extra ${idx + 1}`}
                onClick={() => handleRemoveIndex(idx)}
                className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-stone-950/75 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          aria-label="Adicionar URL externa na galeria"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="Ou cole uma URL https://... e clique em +"
          className="flex-1 min-h-[38px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
        />
        <button
          type="button"
          onClick={handleAddManualUrl}
          aria-label="Adicionar link de foto"
          className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] rounded-xl border border-stone-300 bg-white text-stone-700 hover:border-primary-500 hover:text-primary-700"
        >
          <Plus size={16} />
        </button>
      </div>

      {errorMsg && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-700">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
};
