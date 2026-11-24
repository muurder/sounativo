import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.svg'],
      manifest: {
        name: 'SouNativo — Marketplace de Viagens Autênticas',
        short_name: 'SouNativo',
        description:
          'Descubra experiências autênticas de viagem pelo Brasil com agências verificadas e guias locais.',
        theme_color: '#0F4C3A',
        background_color: '#FAFAF9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/robots\.txt$/,
          /^\/sitemap\.xml$/,
          // Rotas reservadas do Firebase Hosting (Auth handler, init.js etc.).
          // Sem isto, o service worker intercepta o popup/redirect do Google
          // e serve o SPA no lugar do handler de autenticação.
          /^\/__/,
        ],
        // Não interceptar fontes ou imagens cross-origin (Google Fonts, Unsplash,
        // Firebase Storage) no Service Worker: o cache HTTP nativo do navegador
        // gerencia esses ativos diretamente sem falhas de CORS/CSP ou "no-response" no Workbox.
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@firebase/storage') || id.includes('firebase/storage')) {
            return 'vendor-firebase-storage';
          }
          if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
            return 'vendor-firebase-auth';
          }
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('lucide-react')) return 'vendor-icons';
          return 'vendor';
        },
      },
    },
  },
});
