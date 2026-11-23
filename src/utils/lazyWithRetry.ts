import { type ComponentType, lazy, type LazyExoticComponent } from 'react';

const CHUNK_RELOAD_STORAGE_KEY = 'sounativo:chunk-reload-ts';
const RELOAD_COOLDOWN_MS = 15_000;

export function isDynamicChunkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i.test(
    message
  );
}

export async function purgeStalePwaCaches(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((reg) => reg.unregister()));
    }
  } catch {
    // Ignore service worker unregister restrictions
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.allSettled(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Ignore CacheStorage restrictions
  }
}

export function shouldAttemptChunkReload(now = Date.now()): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawLast = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY);
    const lastTs = rawLast ? Number(rawLast) : 0;
    if (Number.isFinite(lastTs) && lastTs > 0 && now - lastTs < RELOAD_COOLDOWN_MS) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export async function recoverFromChunkLoadError(): Promise<boolean> {
  if (!shouldAttemptChunkReload()) {
    return false;
  }
  await purgeStalePwaCaches();
  window.location.reload();
  return true;
}

export function lazyWithRetry<T extends ComponentType<Record<string, never>>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: unknown) {
      if (isDynamicChunkError(err)) {
        const triggeredReload = await recoverFromChunkLoadError();
        if (triggeredReload) {
          // Suspend render while browser reloads into fresh bundle
          return await new Promise<{ default: T }>(() => undefined);
        }
      }
      throw err;
    }
  });
}

export function forceHardReloadWithCachePurge(): void {
  void purgeStalePwaCaches().finally(() => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  });
}
