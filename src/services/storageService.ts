import {
  FirebaseStorage,
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { auth, firebaseApp } from './firebase';
import { USE_FIREBASE_EMULATORS, firebaseConfig } from './firebase.config';

let storageInstance: FirebaseStorage | null = null;
let storageEmulatorConnected = false;
let bucketAvailabilityCache: boolean | null = null;

const BUCKET_UNAVAILABLE_SESSION_KEY = 'sounativo_storage_bucket_unprovisioned_v1';

function resolveStorage(): FirebaseStorage | null {
  if (storageInstance) return storageInstance;
  if (!firebaseApp || !firebaseConfig.storageBucket) return null;
  storageInstance = getStorage(firebaseApp);
  storageInstance.maxUploadRetryTime = 8000;
  storageInstance.maxOperationRetryTime = 8000;
  if (USE_FIREBASE_EMULATORS && !storageEmulatorConnected) {
    connectStorageEmulator(storageInstance, 'localhost', 9199);
    storageEmulatorConnected = true;
  }
  return storageInstance;
}

async function isStorageBucketProvisioned(): Promise<boolean> {
  if (USE_FIREBASE_EMULATORS) return true;
  if (bucketAvailabilityCache !== null) return bucketAvailabilityCache;
  if (!firebaseConfig.storageBucket) return false;

  if (typeof window !== 'undefined') {
    try {
      if (window.sessionStorage.getItem(BUCKET_UNAVAILABLE_SESSION_KEY) === '1') {
        bucketAvailabilityCache = false;
        return false;
      }
    } catch {
      // ignore sessionStorage restrictions
    }
  }

  try {
    // Simple GET without custom headers does not trigger a CORS OPTIONS preflight,
    // and Google's UploadServer returns 404 with Access-Control-Allow-Origin: * when unprovisioned.
    const probeUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(
      firebaseConfig.storageBucket
    )}/o?maxResults=1`;
    const res = await fetch(probeUrl, { method: 'GET' });
    if (res.status === 404) {
      bucketAvailabilityCache = false;
      try {
        window.sessionStorage.setItem(BUCKET_UNAVAILABLE_SESSION_KEY, '1');
      } catch {
        // ignore
      }
      return false;
    }
    bucketAvailabilityCache = true;
    return true;
  } catch {
    bucketAvailabilityCache = false;
    return false;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao codificar imagem otimizada.'));
      }
    };
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem otimizada.'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageForInlineFallback(
  file: File,
  scope: StorageMediaScope
): Promise<{ dataUrl: string; bytes: number; contentType: string }> {
  validateImageFile(file);
  if (typeof document === 'undefined') {
    const dataUrl = await blobToDataUrl(file);
    return { dataUrl, bytes: file.size, contentType: file.type };
  }

  const maxDimension = scope === 'avatar' || scope === 'branding' ? 420 : 880;
  const quality = scope === 'avatar' || scope === 'branding' ? 0.8 : 0.74;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        void blobToDataUrl(file)
          .then((dataUrl) => resolve({ dataUrl, bytes: file.size, contentType: file.type }))
          .catch(reject);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob(
        (webpBlob) => {
          const finalizeBlob = (chosen: Blob, mime: string) => {
            void blobToDataUrl(chosen)
              .then((dataUrl) => {
                resolve({ dataUrl, bytes: chosen.size, contentType: mime });
              })
              .catch(reject);
          };

          if (webpBlob && webpBlob.type === 'image/webp') {
            finalizeBlob(webpBlob, 'image/webp');
          } else {
            canvas.toBlob(
              (jpegBlob) => finalizeBlob(jpegBlob ?? file, jpegBlob ? 'image/jpeg' : file.type),
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível processar o arquivo de imagem selecionado.'));
    };

    img.src = objectUrl;
  });
}

export type StorageMediaScope = 'avatar' | 'branding' | 'banners' | 'trips';

export interface UploadedMediaResult {
  downloadUrl: string;
  storagePath: string;
  bytes: number;
  contentType: string;
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export const MAX_RAW_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB raw camera photo before compression
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB ceiling enforced by storage.rules

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export function validateImageFile(file: File): void {
  if (!file) {
    throw new Error('Selecione um arquivo de imagem válido.');
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Formato não suportado. Envie imagens JPG, PNG, WebP, GIF ou AVIF.');
  }
  if (file.size <= 0) {
    throw new Error('O arquivo selecionado está vazio.');
  }
  if (file.size > MAX_RAW_INPUT_BYTES) {
    throw new Error('A imagem original excede 12 MB. Escolha uma foto menor.');
  }
}

export function buildStorageObjectPath(
  ownerUid: string,
  scope: StorageMediaScope,
  originalName: string,
  mimeType: string
): string {
  const cleanUid = ownerUid.trim();
  if (!cleanUid || cleanUid.includes('/')) {
    throw new Error('Identificador de usuário inválido para upload.');
  }

  const ext = EXTENSION_BY_MIME[mimeType] ?? 'webp';
  const stem = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  const uniqueToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const safeFileName = `${stem || scope}-${uniqueToken}.${ext}`;

  if (scope === 'avatar') {
    return `users/${cleanUid}/avatar/${safeFileName}`;
  }
  return `partners/${cleanUid}/${scope}/${safeFileName}`;
}

export function mapStorageError(err: unknown): Error {
  if (err instanceof Error && !('code' in err)) {
    return err;
  }
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'storage/unauthorized':
      return new Error(
        'Sem permissão para enviar esta imagem. Verifique se está logado e se o arquivo tem até 5 MB.'
      );
    case 'storage/canceled':
      return new Error('Envio da imagem cancelado.');
    case 'storage/quota-exceeded':
      return new Error('Cota do Firebase Storage atingida temporariamente.');
    case 'storage/retry-limit-exceeded':
      return new Error('Tempo limite esgotado no upload. Verifique sua conexão e tente novamente.');
    case 'storage/bucket-not-found':
    case 'storage/project-not-found':
      return new Error(
        'Bucket do Firebase Storage ainda não inicializado no Firebase Console (Build → Storage → Get Started).'
      );
    default:
      return new Error('Não foi possível enviar a imagem para o Firebase Storage.');
  }
}

/**
 * Resizes and compresses photos in the browser to WebP (or JPEG fallback) before uploading,
 * keeping GIF animations intact and preserving fast LCP across mobile networks.
 */
export async function compressImageForUpload(
  file: File,
  scope: StorageMediaScope
): Promise<{ blob: Blob; contentType: string }> {
  validateImageFile(file);

  // Keep animated GIFs or already-compact WebP files (< 160 KB) untouched
  if (
    file.type === 'image/gif' ||
    (file.type === 'image/webp' && file.size <= 160 * 1024) ||
    typeof document === 'undefined'
  ) {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('A imagem excede o limite máximo de 5 MB permitido pelo servidor.');
    }
    return { blob: file, contentType: file.type };
  }

  const maxDimension = scope === 'avatar' || scope === 'branding' ? 640 : 1600;
  const quality = scope === 'avatar' || scope === 'branding' ? 0.88 : 0.84;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        if (file.size > MAX_UPLOAD_BYTES) {
          reject(new Error('A imagem excede o limite de 5 MB.'));
          return;
        }
        resolve({ blob: file, contentType: file.type });
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (webpBlob) => {
          const finalize = (candidate: Blob | null, mime: string) => {
            if (!candidate) {
              if (file.size <= MAX_UPLOAD_BYTES) {
                resolve({ blob: file, contentType: file.type });
              } else {
                reject(new Error('Não foi possível otimizar a imagem abaixo de 5 MB.'));
              }
              return;
            }
            const chosen = candidate.size < file.size ? candidate : file;
            const chosenType = candidate.size < file.size ? mime : file.type;
            if (chosen.size > MAX_UPLOAD_BYTES) {
              reject(new Error('Mesmo após otimização, a imagem excede o limite de 5 MB.'));
              return;
            }
            resolve({ blob: chosen, contentType: chosenType });
          };

          if (webpBlob && webpBlob.type === 'image/webp') {
            finalize(webpBlob, 'image/webp');
          } else {
            canvas.toBlob((jpegBlob) => finalize(jpegBlob, 'image/jpeg'), 'image/jpeg', quality);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível processar o arquivo de imagem selecionado.'));
    };

    img.src = objectUrl;
  });
}

export async function uploadImageToStorage(
  file: File,
  scope: StorageMediaScope,
  onProgress?: (percent: number) => void
): Promise<UploadedMediaResult> {
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('Faça login para enviar imagens ao SouNativo.');
  }

  const activeStorage = resolveStorage();
  const bucketReady = activeStorage ? await isStorageBucketProvisioned() : false;

  if (!activeStorage || !bucketReady) {
    onProgress?.(35);
    const inline = await compressImageForInlineFallback(file, scope);
    const storagePath = buildStorageObjectPath(currentUid, scope, file.name, inline.contentType);
    onProgress?.(100);
    return {
      downloadUrl: inline.dataUrl,
      storagePath,
      bytes: inline.bytes,
      contentType: inline.contentType,
    };
  }

  const { blob, contentType } = await compressImageForUpload(file, scope);
  const storagePath = buildStorageObjectPath(currentUid, scope, file.name, contentType);
  const objectRef = ref(activeStorage, storagePath);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(objectRef, blob, {
      contentType,
      cacheControl: 'public,max-age=31536000,immutable',
    });

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0 && onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(Math.min(100, Math.max(0, pct)));
        }
      },
      async (err) => {
        try {
          bucketAvailabilityCache = false;
          const inline = await compressImageForInlineFallback(file, scope);
          onProgress?.(100);
          resolve({
            downloadUrl: inline.dataUrl,
            storagePath,
            bytes: inline.bytes,
            contentType: inline.contentType,
          });
        } catch {
          reject(mapStorageError(err));
        }
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          onProgress?.(100);
          resolve({
            downloadUrl,
            storagePath,
            bytes: blob.size,
            contentType,
          });
        } catch (urlErr) {
          reject(mapStorageError(urlErr));
        }
      }
    );
  });
}

export async function deleteStorageFileByUrl(fileUrl: string | undefined | null): Promise<void> {
  const activeStorage = resolveStorage();
  if (!activeStorage || !fileUrl) return;
  if (
    !fileUrl.includes('firebasestorage.googleapis.com') &&
    !fileUrl.includes('.firebasestorage.app')
  ) {
    return;
  }
  try {
    const fileRef = ref(activeStorage, fileUrl);
    await deleteObject(fileRef);
  } catch {
    // Non-fatal cleanup if file was already removed or external
  }
}
