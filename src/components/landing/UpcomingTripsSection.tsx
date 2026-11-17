import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { Trip, TripCategory } from '@/types';
import { filterAndSortTrips } from '@/utils/tripFilters';
import { InterestFilterBar } from './InterestFilterBar';
import { TripGrid } from '@/components/trips/TripGrid';
import { cn } from '@/utils/cn';

type QuickWindow = 'all' | 'dec' | 'jan' | 'budget';

interface UpcomingTripsSectionProps {
  trips: Trip[];
  loading: boolean;
  favorites: string[];
  onToggleFavorite: (tripId: string) => void;
}

const WINDOW_TABS: Array<{ id: QuickWindow; label: string }> = [
  { id: 'all', label: 'Todas as saídas' },
  { id: 'dec', label: 'Dezembro · Fim de Ano' },
  { id: 'jan', label: 'Janeiro · Férias' },
  { id: 'budget', label: 'Até R$ 1.600' },
];

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({
  trips,
  loading,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | 'ALL'>('ALL');
  const [quickWindow, setQuickWindow] = useState<QuickWindow>('all');

  const filtered = useMemo(() => {
    return filterAndSortTrips(trips, {
      category: selectedCategory,
      month: quickWindow === 'dec' ? '2026-12' : quickWindow === 'jan' ? '2027-01' : undefined,
      maxPrice: quickWindow === 'budget' ? 1600 : undefined,
    });
  }, [quickWindow, selectedCategory, trips]);

  return (
    <section className="bg-accent-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-600">
              <Calendar size={13} aria-hidden="true" />
              Agenda aberta
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Próximas saídas curadas
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-[58ch]">
              Escolha pelo mês da viagem, interesse ou faixa de preço e veja os valores completos
              com transparência.
            </p>
          </div>

          <Link
            to="/trips"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 shrink-0"
          >
            Ver catálogo completo <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {WINDOW_TABS.map((tab) => {
            const active = quickWindow === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setQuickWindow(tab.id)}
                className={cn(
                  'min-h-[38px] rounded-xl px-3.5 text-xs font-semibold transition-colors border',
                  active
                    ? 'border-secondary-500 bg-secondary-500 text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-secondary-300'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <InterestFilterBar selected={selectedCategory} onSelect={setSelectedCategory} />

        <TripGrid
          trips={filtered.slice(0, 6)}
          loading={loading}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          onResetFilters={() => {
            setSelectedCategory('ALL');
            setQuickWindow('all');
          }}
        />
      </div>
    </section>
  );
};
