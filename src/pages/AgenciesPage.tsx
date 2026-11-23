import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { usePageMeta } from '@/hooks/usePageMeta';
import { normalizeSearchText } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

export const AgenciesPage: React.FC = () => {
  const { agencies, loading, error, reload } = useAgencies(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');

  usePageMeta({
    title: 'Agências de Turismo Verificadas',
    description: 'Conheça operadoras regionais selecionadas pela curadoria SouNativo.',
    canonicalPath: '/agencies',
  });

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    for (const agency of agencies) {
      if (agency.state?.trim()) {
        set.add(agency.state.trim().toUpperCase());
      }
    }
    return Array.from(set).sort();
  }, [agencies]);

  const filteredAgencies = useMemo(() => {
    const query = normalizeSearchText(searchTerm);
    return agencies.filter((agency) => {
      if (selectedState && agency.state?.trim().toUpperCase() !== selectedState) {
        return false;
      }
      if (!query) return true;
      const haystack = normalizeSearchText(
        `${agency.name} ${agency.city ?? ''} ${agency.state ?? ''} ${agency.description ?? ''}`
      );
      return haystack.includes(query);
    });
  }, [agencies, searchTerm, selectedState]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-2xl mb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Agências Verificadas
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Operadoras regionais selecionadas pela excelência em atendimento e curadoria local.
        </p>
      </div>

      {!loading && agencies.length > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <label htmlFor="agencies-search" className="sr-only">
              Buscar agência por nome ou cidade
            </label>
            <input
              id="agencies-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar agência, cidade ou especialidade..."
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="sm:w-44">
            <label htmlFor="agencies-state-filter" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="agencies-state-filter"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Todos os estados</option>
              {stateOptions.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
      ) : filteredAgencies.length === 0 ? (
        <EmptyState
          title="Nenhuma agência encontrada"
          description="Ajuste a busca ou o estado para explorar mais operadoras ativas."
          actionLabel={searchTerm || selectedState ? 'Limpar filtros' : undefined}
          onAction={
            searchTerm || selectedState
              ? () => {
                  setSearchTerm('');
                  setSelectedState('');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
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
                  {agency.verified ? (
                    <Badge tone="primary" className="mb-1">
                      <ShieldCheck size={12} /> Verificada
                    </Badge>
                  ) : (
                    <Badge tone="neutral" className="mb-1">
                      Parceira
                    </Badge>
                  )}
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
