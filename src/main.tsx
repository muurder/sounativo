import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import './index.css';

// Clear stale legacy Supabase auth keys and caches from v1 PWA builds
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
