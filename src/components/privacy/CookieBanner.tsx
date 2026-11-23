import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { useConsent } from '@/hooks/useConsent';

export const CookieBanner: React.FC = () => {
  const { consent, isOpen, acceptAll, rejectNonEssential, saveCustomConsent, closeConsentBanner } =
    useConsent();

  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(consent.analytics);
  const [marketingEnabled, setMarketingEnabled] = useState(consent.marketing);

  if (!isOpen) return null;

  const handleSaveCustom = () => {
    saveCustomConsent({
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    });
    setShowPreferences(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestão de Privacidade e Cookies"
      className="fixed z-50 bottom-20 md:bottom-6 inset-x-3 sm:inset-x-6 md:inset-x-auto md:right-6 md:max-w-xl rounded-3xl border border-white/60 bg-gradient-to-br from-white/95 via-white/90 to-stone-50/85 p-5 sm:p-6 shadow-[0_20px_50px_-10px_rgba(15,76,58,0.18),0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-xl text-stone-900 transition-all duration-300 overflow-hidden"
    >
      {/* Ambient glass gradient highlights */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 -z-10 h-36 w-36 rounded-full bg-primary-400/15 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-36 w-36 rounded-full bg-secondary-400/15 blur-2xl"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/15 to-primary-600/5 border border-primary-500/20 text-primary-700 shadow-sm">
            <Cookie size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-snug">
              Sua privacidade no SouNativo
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-600/20 text-[10px] sm:text-[11px] font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conformidade LGPD (Lei 13.709/2018)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={closeConsentBanner}
          aria-label="Fechar aviso de cookies"
          className="h-8 w-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
        >
          <X size={17} />
        </button>
      </div>

      {!showPreferences ? (
        <div className="space-y-4">
          <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
            Utilizamos cookies essenciais para autenticação segura e funcionamento básico do site.
            Com sua permissão, também utilizamos cookies de análise e marketing para aprimorar sua
            experiência e medir a relevância dos roteiros.
          </p>

          <div className="text-xs text-stone-500 flex items-center flex-wrap gap-1">
            <span>Consulte nossa</span>
            <Link
              to="/privacy"
              className="font-medium text-primary-700 underline underline-offset-4 decoration-primary-300 hover:text-primary-900 hover:decoration-primary-600 transition-colors"
            >
              Política de Privacidade
            </Link>
            <span>e os</span>
            <Link
              to="/terms"
              className="font-medium text-primary-700 underline underline-offset-4 decoration-primary-300 hover:text-primary-900 hover:decoration-primary-600 transition-colors"
            >
              Termos de Uso
            </Link>
            <span>.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
            <button
              type="button"
              onClick={() => {
                setAnalyticsEnabled(consent.analytics);
                setMarketingEnabled(consent.marketing);
                setShowPreferences(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 rounded-xl border border-stone-300/80 bg-white/70 hover:bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-sm transition-all duration-200"
            >
              <Settings2 size={14} className="text-stone-500" /> Personalizar
            </button>
            <button
              type="button"
              onClick={rejectNonEssential}
              className="inline-flex items-center justify-center min-h-[40px] px-4 rounded-xl border border-stone-300/80 bg-white/70 hover:bg-white text-xs font-semibold text-stone-700 hover:text-stone-900 shadow-sm transition-all duration-200"
            >
              Apenas Essenciais
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex items-center justify-center min-h-[40px] px-5 rounded-xl bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:from-primary-500 hover:to-primary-700 text-white text-xs font-bold shadow-md shadow-primary-900/20 hover:shadow-lg hover:shadow-primary-900/30 active:scale-[0.98] transition-all duration-200"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Escolha quais categorias de cookies deseja autorizar. Você pode alterar essas opções a
            qualquer momento no rodapé do site.
          </p>

          <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
            {/* 1. Essenciais */}
            <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-primary-600" />
                  Cookies Estritamente Necessários
                </span>
                <span className="rounded-md bg-stone-200/90 px-2 py-0.5 text-[10px] font-bold text-stone-700 uppercase tracking-wide">
                  Obrigatório
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                Fundamentais para login com Firebase Auth, segurança contra CSRF, integridade de
                sessão e processamento de reservas. Não podem ser desativados.
              </p>
            </div>

            {/* 2. Analytics */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-3.5 space-y-1 hover:border-primary-200/80 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm text-stone-900">
                  Desempenho e Estatísticas (Analytics)
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsEnabled}
                  onClick={() => setAnalyticsEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    analyticsEnabled ? 'bg-primary-600' : 'bg-stone-300'
                  }`}
                >
                  <span className="sr-only">Habilitar cookies analíticos</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      analyticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                Coleta anônima de dados de navegação, Core Web Vitals e páginas mais visitadas para
                melhoria contínua da velocidade e relevância dos pacotes.
              </p>
            </div>

            {/* 3. Marketing */}
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-3.5 space-y-1 hover:border-primary-200/80 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm text-stone-900">
                  Marketing e Personalização
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={marketingEnabled}
                  onClick={() => setMarketingEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    marketingEnabled ? 'bg-primary-600' : 'bg-stone-300'
                  }`}
                >
                  <span className="sr-only">Habilitar cookies de marketing</span>
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      marketingEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                Permite avaliar a eficácia de campanhas em redes sociais e sugerir roteiros baseados
                em seus biomas de interesse sem spam.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60">
            <button
              type="button"
              onClick={() => setShowPreferences(false)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors px-2 py-1"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSaveCustom}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white text-xs font-bold shadow-md shadow-primary-900/20 active:scale-[0.98] transition-all duration-200"
            >
              Salvar Preferências <Check size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
