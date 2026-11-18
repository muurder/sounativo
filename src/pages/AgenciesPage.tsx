import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, MapPin, RefreshCw, ShieldCheck, Star } from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

export const AgenciesPage: React.FC = () => {
  const { agencies, loading, error, reload } = useAgencies(false);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-2xl mb-8 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Agências Verificadas
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Operadoras regionais selecionadas pela excelência em atendimento e curadoria local.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs text-red-900">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void reload()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-64 w-full" />
          ))}
        </div>
      ) : agencies.length === 0 ? (
        <EmptyState
          title="Nenhuma agência encontrada"
          description="Ainda não há operadoras ativas listadas neste filtro."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              to={`/${agency.slug}`}
              className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-card hover:border-primary-300 hover:shadow-editorial transition-all"
            >
              <div className="flex items-center gap-4">
                <SafeImage
                  src={agency.logo}
                  alt={agency.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-2xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <Badge tone="primary" className="mb-1">
                    <ShieldCheck size={12} /> Verificada
                  </Badge>
                  <h2 className="font-serif text-lg font-bold text-stone-900 truncate group-hover:text-primary-600">
                    {agency.name}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm text-stone-600 line-clamp-3 flex-1">
                {agency.description}
              </p>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} className="text-secondary-600" />
                  {agency.city || 'Brasil'}
                  {agency.state ? `, ${agency.state}` : ''}
                </span>
                <span className="inline-flex items-center gap-1 text-primary-600">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {typeof agency.rating === 'number' && agency.rating > 0
                    ? agency.rating.toFixed(1)
                    : 'Novo'}{' '}
                  <ArrowRight size={14} className="ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgenciesPage;
