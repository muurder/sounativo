import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Drama,
  Globe,
  Heart,
  Landmark,
  LucideIcon,
  Moon,
  Mountain,
  Palette,
  TreePine,
  Umbrella,
  Utensils,
  Wallet,
} from 'lucide-react';
import { TripCategory } from '@/types';
import { cn } from '@/utils/cn';

interface InterestFilterBarProps {
  selected: TripCategory | 'ALL';
  onSelect: (category: TripCategory | 'ALL') => void;
}

const CHIPS: Array<{
  id: TripCategory | 'ALL';
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'ALL', label: 'Todos', icon: Globe },
  { id: 'NATUREZA', label: 'Natureza', icon: TreePine },
  { id: 'PRAIA', label: 'Praia', icon: Umbrella },
  { id: 'AVENTURA', label: 'Aventura', icon: Mountain },
  { id: 'CULTURA', label: 'Cultura', icon: Drama },
  { id: 'HISTORIA', label: 'História', icon: Landmark },
  { id: 'GASTRONOMIA', label: 'Gastronomia', icon: Utensils },
  { id: 'ROMANTICO', label: 'Romântico', icon: Heart },
  { id: 'ARTE', label: 'Arte', icon: Palette },
  { id: 'VIDA_NOTURNA', label: 'Vida Noturna', icon: Moon },
  { id: 'VIAGEM_BARATA', label: 'Econômicas', icon: Wallet },
];

export const InterestFilterBar: React.FC<InterestFilterBarProps> = ({ selected, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const nudgeScroll = (delta: number) => {
    scrollContainerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => nudgeScroll(-240)}
        aria-label="Rolar categorias para a esquerda"
        className="hidden md:inline-flex min-w-[40px] min-h-[40px] items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm hover:border-primary-500 hover:text-primary-600"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Filtrar roteiros por interesse"
        className="flex flex-1 items-center gap-2.5 overflow-x-auto scrollbar-hide py-1"
      >
        {CHIPS.map((chip) => {
          const Icon = chip.icon;
          const active = selected === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(chip.id)}
              className={cn(
                'inline-flex items-center gap-2 shrink-0 min-h-[42px] rounded-full border px-4 text-xs sm:text-sm font-semibold transition-all',
                active
                  ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-primary-300 hover:text-primary-700'
              )}
            >
              <Icon size={15} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => nudgeScroll(240)}
        aria-label="Rolar categorias para a direita"
        className="hidden md:inline-flex min-w-[40px] min-h-[40px] items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm hover:border-primary-500 hover:text-primary-600"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
