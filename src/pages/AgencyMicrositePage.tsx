import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAgencyMicrosite } from '@/hooks/useAgencyMicrosite';
import { TripGrid } from '@/components/trips/TripGrid';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export const AgencyMicrositePage: React.FC = () => {
  const { agencySlug } = useParams<{ agencySlug: string }>();
  const { agency, trips, loading } = useAgencyMicrosite(agencySlug);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
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

  return (
    <div>
      <section className="bg-primary-700 text-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <img
              src={agency.logo}
              alt={agency.name}
              className="h-24 w-24 rounded-3xl object-cover border-2 border-white/30 shadow-lg shrink-0"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary" className="bg-white/15 text-white border-white/25">
                  {agency.isGuide ? <Award size={12} /> : <ShieldCheck size={12} />}
                  {agency.isGuide ? `Guia Cadastur ${agency.cadastur || ''}` : 'Agência Verificada'}
                </Badge>
                {agency.city && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary-100">
                    <MapPin size={13} /> {agency.city}, {agency.state}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold">
                {agency.heroTitle || agency.name}
              </h1>
              <p className="text-sm sm:text-base text-primary-100 max-w-2xl">
                {agency.heroSubtitle || agency.description}
              </p>
            </div>
          </div>

          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-6 text-sm font-semibold text-white hover:bg-[#0F766E] transition-colors shrink-0"
            >
              <MessageCircle size={18} />
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Roteiros disponíveis
          </h2>
          <Link to="/trips" className="text-sm font-semibold text-primary-600 hover:underline">
            Ver marketplace completo
          </Link>
        </div>

        <TripGrid trips={trips} loading={false} />
      </section>
    </div>
  );
};

export default AgencyMicrositePage;
