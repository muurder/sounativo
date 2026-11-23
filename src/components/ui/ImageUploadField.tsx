import React, { useId, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Link2, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { StorageMediaScope, uploadImageToStorage } from '@/services/storageService';
import { SafeImage } from './SafeImage';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';

interface ImageUploadFieldProps {
  id?: string;
  label: string;
  helperText?: string;
  scope: StorageMediaScope;
  value: string;
  onChange: (url: string) => void;
  previewShape?: 'square' | 'wide';
  allowExternalUrl?: boolean;
  onUploaded?: (downloadUrl: string) => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  helperText,
  scope,
  value,
  onChange,
  previewShape = 'square',
  allowExternalUrl = true,
  onUploaded,
}) => {
  const generatedId = useId();
  const inputId = id ?? `upload-${generatedId}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    setProgress(5);

    try {
      const result = await uploadImageToStorage(file, scope, (pct) => setProgress(pct));
      onChange(result.downloadUrl);
      onUploaded?.(result.downloadUrl);
      showToast('Imagem otimizada e enviada ao Firebase Storage!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar imagem.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      void handleFile(droppedFile);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700">
          {label}
        </label>
        {allowExternalUrl && (
          <button
            type="button"
            onClick={() => setShowUrlInput((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:underline"
          >
            <Link2 size={12} />
            {showUrlInput ? 'Ocultar link manual' : 'Usar URL externa'}
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-2xl border-2 border-dashed p-3.5 transition-colors bg-stone-50/70',
          dragActive ? 'border-primary-500 bg-primary-50/60' : 'border-stone-300',
          uploading && 'opacity-80 pointer-events-none'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
          {value ? (
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shrink-0',
                previewShape === 'wide' ? 'h-24 w-full sm:w-40' : 'h-20 w-20'
              )}
            >
              <SafeImage src={value} alt={label} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 shrink-0',
                previewShape === 'wide' ? 'h-24 w-full sm:w-40' : 'h-20 w-20'
              )}
            >
              <ImagePlus size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 min-h-[38px] rounded-xl bg-white border border-stone-300 px-3.5 text-xs font-semibold text-stone-800 hover:border-primary-500 hover:text-primary-700 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-primary-600" />
                    Enviando ({progress}%)...
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} className="text-primary-600" />
                    {value ? 'Trocar imagem' : 'Enviar do dispositivo'}
                  </>
                )}
              </button>

              {value && !uploading && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="inline-flex items-center gap-1 min-h-[38px] rounded-xl px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} /> Remover
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-500 leading-snug">
              {helperText ??
                'Arraste ou selecione JPG, PNG ou WebP (otimização automática para WebP até 5 MB).'}
            </p>

            {uploading && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full bg-primary-600 transition-all duration-200"
                  style={{ width: `${Math.max(8, progress)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(e) => void handleFile(e.target.files?.[0])}
          className="sr-only"
        />
      </div>

      {showUrlInput && (
        <input
          type="url"
          aria-label={`${label} (URL externa)`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
        />
      )}

      {errorMsg && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-700">
          <AlertCircle size={13} className="shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
};
