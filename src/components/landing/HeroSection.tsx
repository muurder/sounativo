import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, MapPin } from 'lucide-react';
import { Trip } from '@/types';
import { HERO_QUOTES } from '@/utils/constants';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { formatCurrencyBRL, formatDateRange } from '@/utils/formatters';
import { SafeImage } from '@/components/ui/SafeImage';
import { HeroSearchBar } from './HeroSearchBar';

interface HeroSectionProps {
  highlightTrip?: Trip | null;
}

const HERO_TRUST_POINTS = [
  'Agências verificadas no Cadastur',
  'Parcelamento em até 10x ou Pix',
  'Atendimento direto no WhatsApp',
] as const;

export const HeroSection: React.FC<HeroSectionProps> = ({ highlightTrip }) => {
  const heroImage = useMemo(() => getDailyHeroImage(), []);
  const quote = useMemo(() => {
    const dayIndex = new Date().getDate() % HERO_QUOTES.length;
    return HERO_QUOTES[dayIndex];
  }, []);

  return (
    <section className="relative overflow-hidden bg-primary-900 text-white">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Paisagem natural brasileira curada pelo SouNativo"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="hero-grain absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/70 to-primary-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-transparent to-primary-900/25" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          <div className="lg:col-span-8 space-y-6 animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary-300/40 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-secondary-100 backdrop-blur-sm">
              Curadoria Brasil · Ecoturismo & Cultura
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-[1.06] text-white">
              Descubra o Brasil com quem conhece cada{' '}
              <span className="italic text-secondary-200">trilha.</span>
            </h1>

            <p className="text-base sm:text-xl text-stone-200 font-light max-w-[58ch] leading-relaxed">
              {quote} Roteiros em grupo e experiências autorais conduzidas por agências regionais e
              guias locais credenciados.
            </p>

            <div className="pt-1">
              <HeroSearchBar />
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs sm:text-sm text-stone-200/95">
              {HERO_TRUST_POINTS.map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <Check size={15} className="text-secondary-300 shrink-0" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {highlightTrip && (
            <div className="lg:col-span-4 animate-fade-in-up">
              <Link
                to={`/viagem/${highlightTrip.slug || highlightTrip.id}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-white/25 bg-primary-950/75 p-3.5 backdrop-blur-md shadow-2xl hover:bg-primary-950/90 transition-colors"
              >
                <SafeImage
                  src={highlightTrip.images?.[0] || heroImage}
                  alt={highlightTrip.title}
                  className="h-20 w-20 rounded-xl object-cover shrink-0 border border-white/15"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-secondary-200">
                    <CalendarDays size={12} aria-hidden="true" />
                    Próxima saída destaque
                  </p>
                  <h2 className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1">
                    {highlightTrip.title}
                  </h2>
                  <p className="inline-flex items-center gap-1 text-xs text-stone-300">
                    <MapPin size={11} className="text-secondary-300 shrink-0" />
                    <span className="truncate">{highlightTrip.destination || 'Brasil'}</span>
                  </p>
                  <p className="text-xs text-stone-200">
                    <strong className="text-sm font-extrabold text-white">
                      {formatCurrencyBRL(highlightTrip.price)}
                    </strong>{' '}
                    · {formatDateRange(highlightTrip.startDate, highlightTrip.endDate)}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="text-secondary-300 shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
