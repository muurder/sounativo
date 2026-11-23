import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { InterestFilterBar } from '@/components/landing/InterestFilterBar';
import { TripGrid } from '@/components/trips/TripGrid';
import { Button } from '@/components/ui/Button';
import { useTrips } from '@/hooks/useTrips';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { TripCategory, TripSearchFilters } from '@/types';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

const VALID_CATEGORIES = new Set<TripCategory>([
  'PRAIA',
  'AVENTURA',
  'NATUREZA',
  'HISTORIA',
  'GASTRONOMIA',
  'ROMANTICO',
  'VIDA_NOTURNA',
  'CULTURA',
  'ARTE',
  'VIAGEM_BARATA',
]);

const VALID_SORTS = new Set<NonNullable<TripSearchFilters['sortBy']>>([
  'featured',
  'price_asc',
  'price_desc',
  'rating',
]);

function parseGuestsParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseCategoryParam(raw: string | null): TripCategory | 'ALL' {
  if (!raw) return 'ALL';
  const upper = raw.toUpperCase() as TripCategory;
  return VALID_CATEGORIES.has(upper) ? upper : 'ALL';
}

function parseMaxPriceParam(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseSortParam(raw: string | null): NonNullable<TripSearchFilters['sortBy']> {
  if (!raw) return 'featured';
  return VALID_SORTS.has(raw as NonNullable<TripSearchFilters['sortBy']>)
    ? (raw as NonNullable<TripSearchFilters['sortBy']>)
    : 'featured';
}

export const TripsPage: React.FC = () => {
  const { openAuth } = useOutletContext<OutletContextValue>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [month, setMonth] = useState(searchParams.get('month') ?? '');
  const [travelers, setTravelers] = useState<number | undefined>(() =>
    parseGuestsParam(searchParams.get('guests'))
  );
  const [category, setCategory] = useState<TripCategory | 'ALL'>(() =>
    parseCategoryParam(searchParams.get('category'))
  );
  const [sortBy, setSortBy] = useState<TripSearchFilters['sortBy']>(() =>
    parseSortParam(searchParams.get('sort'))
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(() =>
    parseMaxPriceParam(searchParams.get('maxPrice'))
  );
  const lastWrittenSearchRef = useRef<string | null>(null);

  useEffect(() => {
    const rawSearch = searchParams.toString();
    if (lastWrittenSearchRef.current === rawSearch) {
      return;
    }
    setQuery(searchParams.get('q') ?? '');
    setMonth(searchParams.get('month') ?? '');
    setTravelers(parseGuestsParam(searchParams.get('guests')));
    setCategory(parseCategoryParam(searchParams.get('category')));
    setMaxPrice(parseMaxPriceParam(searchParams.get('maxPrice')));
    setSortBy(parseSortParam(searchParams.get('sort')));
  }, [searchParams]);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (debouncedQuery !== query) return;
    const next = new URLSearchParams();
    if (debouncedQuery.trim()) next.set('q', debouncedQuery.trim());
    if (month) next.set('month', month);
    if (travelers) next.set('guests', String(travelers));
    if (category !== 'ALL') next.set('category', category);
    if (maxPrice) next.set('maxPrice', String(maxPrice));
    if (sortBy && sortBy !== 'featured') next.set('sort', sortBy);

    const nextStr = next.toString();
    if (nextStr !== searchParams.toString()) {
      lastWrittenSearchRef.current = nextStr;
      setSearchParams(next, { replace: true });
    }
  }, [category, debouncedQuery, maxPrice, month, query, searchParams, setSearchParams, sortBy, travelers]);

  const { trips, allTrips, loading, error, reload } = useTrips({
    query: debouncedQuery,
    category,
    sortBy,
    maxPrice,
    travelers,
    month: month || undefined,
  });
  const { profile, toggleFavorite } = useUserProfile();
  const { showToast } = useToast();

  usePageMeta({
    title: 'Explorar Roteiros e Pacotes Verificados',
    description:
      'Compare experiências autênticas de viagem pelo Brasil por destino, mês de saída, categoria e orçamento.',
    canonicalPath: '/trips',
  });

  const monthOptions = React.useMemo(() => {
    const months = new Set<string>();
    for (const t of allTrips) {
      if (typeof t.startDate === 'string' && /^\d{4}-\d{2}/.test(t.startDate)) {
        months.add(t.startDate.slice(0, 7));
      }
      if (Array.isArray(t.departures)) {
        for (const dep of t.departures) {
          if (typeof dep?.startDate === 'string' && /^\d{4}-\d{2}/.test(dep.startDate)) {
            months.add(dep.startDate.slice(0, 7));
          }
        }
      }
    }
    return Array.from(months)
      .sort()
      .map((ym) => {
        const [yearStr, monthStr] = ym.split('-');
        const dt = new Date(Number(yearStr), Number(monthStr) - 1, 1);
        const label = dt.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return {
          value: ym,
          label: label.charAt(0).toUpperCase() + label.slice(1),
        };
      });
  }, [allTrips]);

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

  const resetAllFilters = () => {
    setQuery('');
    setMonth('');
    setCategory('ALL');
    setMaxPrice(undefined);
    setTravelers(undefined);
    setSortBy('featured');
    lastWrittenSearchRef.current = '';
    setSearchParams({});
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Todas as Experiências
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Encontre roteiros verificados por destino, mês de saída, interesse ou investimento.
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

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
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

          <div className="md:col-span-2 flex items-center gap-2">
            <CalendarDays size={16} className="text-stone-500 shrink-0" />
            <label htmlFor="filter-month" className="sr-only">
              Mês de saída
            </label>
            <select
              id="filter-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="">Qualquer mês</option>
              {monthOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <Users size={16} className="text-stone-500 shrink-0" />
            <label htmlFor="min-travelers" className="sr-only">
              Quantidade mínima de viajantes
            </label>
            <select
              id="min-travelers"
              value={travelers ?? ''}
              onChange={(e) => setTravelers(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="">Qualquer grupo</option>
              <option value="1">1+ viajante</option>
              <option value="2">2+ viajantes</option>
              <option value="4">4+ viajantes</option>
              <option value="8">8+ viajantes</option>
              <option value="12">12+ viajantes</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
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
              <option value="">Orçamento</option>
              <option value="1000">Até R$ 1.000</option>
              <option value="2000">Até R$ 2.000</option>
              <option value="3500">Até R$ 3.500</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sort-trips" className="sr-only">
              Ordenar roteiros
            </label>
            <select
              id="sort-trips"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TripSearchFilters['sortBy'])}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
            >
              <option value="featured">Destaques</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="rating">Melhor nota</option>
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
        favorites={safeFavorites}
        onToggleFavorite={(id) => void handleToggleFavorite(id)}
        onResetFilters={resetAllFilters}
      />
    </div>
  );
};

export default TripsPage;
