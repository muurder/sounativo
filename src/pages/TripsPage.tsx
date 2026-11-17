import React, { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { InterestFilterBar } from '@/components/landing/InterestFilterBar';
import { TripGrid } from '@/components/trips/TripGrid';
import { useTrips } from '@/hooks/useTrips';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { TripCategory, TripSearchFilters } from '@/types';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const TripsPage: React.FC = () => {
  const { openAuth } = useOutletContext<OutletContextValue>();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<TripCategory | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<TripSearchFilters['sortBy']>('featured');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const debouncedQuery = useDebounce(query, 250);
  const { trips, loading } = useTrips({ query: debouncedQuery, category, sortBy, maxPrice });
  const { profile, toggleFavorite } = useUserProfile();
  const { showToast } = useToast();

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Todas as Experiências
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Encontre roteiros verificados por destino, interesse ou faixa de investimento.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <label htmlFor="catalog-search" className="sr-only">
              Buscar por destino ou título
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar destino, parque nacional, agência..."
              className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-stone-500 shrink-0" />
            <label htmlFor="max-price" className="sr-only">
              Preço máximo
            </label>
            <select
              id="max-price"
              value={maxPrice ?? ''}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="">Qualquer orçamento</option>
              <option value="1000">Até R$ 1.000</option>
              <option value="2000">Até R$ 2.000</option>
              <option value="3500">Até R$ 3.500</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="sort-trips" className="sr-only">
              Ordenar roteiros
            </label>
            <select
              id="sort-trips"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TripSearchFilters['sortBy'])}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="featured">Destaques SouNativo</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="rating">Melhor avaliação</option>
            </select>
          </div>
        </div>

        <InterestFilterBar selected={category} onSelect={setCategory} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
        {loading ? 'Carregando roteiros...' : `${trips.length} experiência(s) encontrada(s)`}
      </p>

      <TripGrid
        trips={trips}
        loading={loading}
        favorites={profile?.favorites ?? []}
        onToggleFavorite={(id) => void handleToggleFavorite(id)}
        onResetFilters={() => {
          setQuery('');
          setCategory('ALL');
          setMaxPrice(undefined);
        }}
      />
    </div>
  );
};

export default TripsPage;
