import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Cookie, Settings2, ShieldCheck, X } from 'lucide-react';
import { useConsent } from '@/hooks/useConsent';
import { Button } from '@/components/ui/Button';

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
      className="fixed z-50 bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:max-w-xl rounded-2xl border border-stone-200/90 bg-white/98 p-5 sm:p-6 shadow-editorial backdrop-blur-md text-stone-900 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
            <Cookie size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900">
              Sua privacidade no SouNativo
            </h2>
            <p className="text-xs text-stone-500">Conformidade LGPD (Lei 13.709/2018)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeConsentBanner}
          aria-label="Fechar aviso de cookies"
          className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {!showPreferences ? (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Utilizamos cookies essenciais para autenticação segura e funcionamento básico do site.
            Com sua permissão, também utilizamos cookies de análise e marketing para aprimorar sua
            experiência e medir a relevância dos roteiros.
          </p>

          <div className="text-xs text-stone-500">
            Consulte nossa{' '}
            <Link
              to="/privacy"
              className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              Política de Privacidade
            </Link>{' '}
            e os{' '}
            <Link
              to="/terms"
              className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800"
            >
              Termos de Uso
            </Link>
            .
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setAnalyticsEnabled(consent.analytics);
                setMarketingEnabled(consent.marketing);
                setShowPreferences(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <Settings2 size={14} /> Personalizar
            </button>
            <Button variant="outline" size="sm" onClick={rejectNonEssential}>
              Apenas Essenciais
            </Button>
            <Button variant="primary" size="sm" onClick={acceptAll}>
              Aceitar Todos
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-stone-600 leading-relaxed">
            Escolha quais categorias de cookies deseja autorizar. Você pode alterar essas opções a
            qualquer momento no rodapé do site.
          </p>

          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            {/* 1. Essenciais */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-primary-600" />
                  Cookies Estritamente Necessários
                </span>
                <span className="rounded-md bg-stone-200/90 px-2 py-0.5 text-[10px] font-bold text-stone-700 uppercase">
                  Obrigatório
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed">
                Fundamentais para login com Firebase Auth, segurança contra CSRF, integridade de
                sessão e processamento de reservas. Não podem ser desativados.
              </p>
            </div>

            {/* 2. Analytics */}
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
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
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
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

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowPreferences(false)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-800 transition-colors"
            >
              Voltar
            </button>
            <Button variant="primary" size="sm" onClick={handleSaveCustom}>
              Salvar Preferências <Check size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
