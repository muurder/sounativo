import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { HERO_QUOTES } from '@/utils/constants';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { HeroSearchBar } from './HeroSearchBar';

const HERO_TRUST_POINTS = [
  'Agências verificadas',
  'Guias locais com Cadastur',
  'Contato direto antes do embarque',
] as const;

export const HeroSection: React.FC = () => {
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
          fetchPriority="high"
          className="h-full w-full object-cover opacity-55"
        />
        <div className="hero-grain absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-900/70 to-primary-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl space-y-6 animate-fade-in-up">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-[1.06] text-white">
            Descubra o Brasil com quem conhece cada{' '}
            <span className="italic text-secondary-200">trilha</span>.
          </h1>

          <p className="text-base sm:text-xl text-stone-200 font-light max-w-[60ch] leading-relaxed">
            {quote} Roteiros autorais pela natureza e cultura brasileira, com saída garantida por
            operadoras regionais.
          </p>

          <div className="pt-2">
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
      </div>
    </section>
  );
};
