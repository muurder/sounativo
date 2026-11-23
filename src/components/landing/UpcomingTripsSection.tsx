import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { Trip, TripCategory } from '@/types';
import { filterAndSortTrips } from '@/utils/tripFilters';
import { InterestFilterBar } from './InterestFilterBar';
import { TripGrid } from '@/components/trips/TripGrid';
import { cn } from '@/utils/cn';

type QuickWindow = string;

interface UpcomingTripsSectionProps {
  trips: Trip[];
  loading: boolean;
  favorites: string[];
  onToggleFavorite: (tripId: string) => void;
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function formatMonthTabLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const monthIdx = Number(month) - 1;
  const monthName = MONTH_NAMES_PT[monthIdx] ?? ym;
  return `${monthName} · ${year}`;
}

export const UpcomingTripsSection: React.FC<UpcomingTripsSectionProps> = ({
  trips,
  loading,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | 'ALL'>('ALL');
  const [quickWindow, setQuickWindow] = useState<QuickWindow>('all');

  const windowTabs = useMemo<Array<{ id: QuickWindow; label: string }>>(() => {
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthsSet = new Set<string>();

    for (const trip of trips) {
      if (typeof trip.startDate === 'string' && /^\d{4}-\d{2}/.test(trip.startDate)) {
        monthsSet.add(trip.startDate.slice(0, 7));
      }
      if (Array.isArray(trip.departures)) {
        for (const dep of trip.departures) {
          if (typeof dep?.startDate === 'string' && /^\d{4}-\d{2}/.test(dep.startDate)) {
            monthsSet.add(dep.startDate.slice(0, 7));
          }
        }
      }
    }

    const sortedMonths = Array.from(monthsSet).sort();
    const upcomingMonths = sortedMonths.filter((ym) => ym >= currentYm);
    const featuredMonths = (upcomingMonths.length > 0 ? upcomingMonths : sortedMonths).slice(0, 2);

    return [
      { id: 'all', label: 'Todas as saídas' },
      ...featuredMonths.map((ym) => ({ id: ym, label: formatMonthTabLabel(ym) })),
      { id: 'budget', label: 'Até R$ 1.600' },
    ];
  }, [trips]);

  const filtered = useMemo(() => {
    return filterAndSortTrips(trips, {
      category: selectedCategory,
      month: /^\d{4}-\d{2}$/.test(quickWindow) ? quickWindow : undefined,
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
          {windowTabs.map((tab) => {
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
