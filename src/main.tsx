import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { captureRuntimeError } from '@/services/telemetryService';
import { isDynamicChunkError, recoverFromChunkLoadError } from '@/utils/lazyWithRetry';
import './index.css';

// Clear stale legacy Supabase auth keys, handle Vite chunk preload mismatches, and refresh SW
if (typeof window !== 'undefined') {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage access errors in private contexts
  }

  if ('caches' in window) {
    void caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.includes('supabase')).map((key) => caches.delete(key)))
      );
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void recoverFromChunkLoadError();
  });

  if ('serviceWorker' in navigator) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    void navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  }

  window.addEventListener('unhandledrejection', (event) => {
    if (isDynamicChunkError(event.reason)) {
      event.preventDefault();
      void recoverFromChunkLoadError();
      return;
    }
    void captureRuntimeError(event.reason);
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento #root não encontrado no DOM.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
