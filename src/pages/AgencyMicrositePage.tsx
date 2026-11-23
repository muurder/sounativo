import React from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Award, Globe2, MapPin, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAgencyMicrosite } from '@/hooks/useAgencyMicrosite';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useTheme } from '@/context/ThemeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { TripGrid } from '@/components/trips/TripGrid';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import { sanitizeExternalUrl } from '@/utils/securitySanitizer';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

const FONT_CLASS_MAP = {
  classic: 'font-serif',
  modern: 'font-sans tracking-tight',
  playful: 'font-serif tracking-wide',
} as const;

const RADIUS_CLASS_MAP = {
  none: 'rounded-none',
  soft: 'rounded-2xl',
  full: 'rounded-full',
} as const;

export const AgencyMicrositePage: React.FC = () => {
  const { agencySlug } = useParams<{ agencySlug: string }>();
  const { openAuth } = useOutletContext<OutletContextValue>();
  const { agency, trips, loading, error, reload } = useAgencyMicrosite(agencySlug);
  const { agencyTheme } = useTheme();
  const { profile, toggleFavorite } = useUserProfile();
  const { showToast } = useToast();

  usePageMeta({
    title: agency ? `${agency.name} — Parceiro Verificado` : 'Microsite SouNativo',
    description: agency?.description,
    image: agency?.heroBannerUrl || agency?.logo,
    canonicalPath: agency ? `/${agency.slug}` : undefined,
    ogType: 'profile',
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error && !agency) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Erro ao carregar microsite"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => void reload()}
        />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Parceiro não encontrado"
          description="Não localizamos uma agência ou guia ativo com este endereço no SouNativo."
        />
      </div>
    );
  }

  const whatsappDigits = agency.whatsapp?.replace(/\D/g, '');
  const headingFont = FONT_CLASS_MAP[agencyTheme?.fontPair ?? 'classic'] ?? 'font-serif';
  const ctaRadius = RADIUS_CLASS_MAP[agencyTheme?.borderRadius ?? 'soft'] ?? 'rounded-2xl';
  const safeBannerUrl =
    agency.heroMode === 'STATIC' ? sanitizeExternalUrl(agency.heroBannerUrl) : null;
  const safeFavorites = Array.isArray(profile?.favorites) ? profile.favorites : [];

  const handleToggleFavorite = async (tripId: string) => {
    try {
      const added = await toggleFavorite(tripId);
      showToast(added ? 'Roteiro salvo nos favoritos.' : 'Removido dos favoritos.', 'success');
    } catch {
      showToast('Faça login para gerenciar favoritos.', 'info');
      openAuth('login');
    }
  };

  return (
    <div>
      <section
        className={cn(
          'relative overflow-hidden py-14 sm:py-20 transition-colors',
          agencyTheme?.headerStyle === 'transparent'
            ? 'bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-white'
            : 'bg-primary-700 text-white'
        )}
      >
        {safeBannerUrl && (
          <div className="absolute inset-0">
            <img
              src={safeBannerUrl}
              alt={`Capa do microsite ${agency.name}`}
              aria-hidden="true"
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-900/75 to-primary-900/50" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <SafeImage
              src={agency.logo}
              alt={agency.name}
              className="h-24 w-24 rounded-3xl object-cover border-2 border-white/30 shadow-lg shrink-0"
            />
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary" className="bg-white/15 text-white border-white/25">
                  {agency.isGuide ? <Award size={12} /> : <ShieldCheck size={12} />}
                  {agency.isGuide
                    ? `Guia Cadastur ${agency.cadastur || 'Ativo'}`
                    : 'Agência Verificada'}
                </Badge>
                {agency.city && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary-100">
                    <MapPin size={13} /> {agency.city}
                    {agency.state ? `, ${agency.state}` : ''}
                  </span>
                )}
              </div>

              <h1 className={cn('text-3xl sm:text-4xl font-bold', headingFont)}>
                {agency.heroTitle || agency.name}
              </h1>
              <p className="text-sm sm:text-base text-primary-100 max-w-2xl">
                {agency.heroSubtitle || agency.description}
              </p>

              {Boolean(agency.languages?.length || agency.specialties?.length) && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-primary-100">
                  {agency.languages && agency.languages.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Globe2 size={13} /> {agency.languages.join(' · ')}
                    </span>
                  )}
                  {agency.specialties && agency.specialties.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={13} /> {agency.specialties.join(' · ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'min-h-[46px] inline-flex items-center justify-center gap-2 px-6 text-sm font-semibold transition-colors shrink-0',
                ctaRadius,
                agencyTheme?.buttonStyle === 'outline'
                  ? 'border-2 border-white text-white hover:bg-white/15'
                  : agencyTheme?.buttonStyle === 'ghost'
                    ? 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
                    : 'bg-[#128C7E] text-white hover:bg-[#0F766E]'
              )}
            >
              <MessageCircle size={18} />
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn('text-2xl sm:text-3xl font-bold text-stone-900', headingFont)}>
            Roteiros disponíveis ({trips.length})
          </h2>
          <Link to="/trips" className="text-sm font-semibold text-primary-600 hover:underline">
            Ver marketplace completo
          </Link>
        </div>

        <TripGrid
          trips={trips}
          loading={false}
          basePath={`/${agency.slug}/viagem`}
          favorites={safeFavorites}
          onToggleFavorite={(id) => void handleToggleFavorite(id)}
        />
      </section>
    </div>
  );
};

export default AgencyMicrositePage;
