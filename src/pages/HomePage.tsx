import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturedTripsSection } from '@/components/landing/FeaturedTripsSection';
import { InterestFilterBar } from '@/components/landing/InterestFilterBar';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { GuidesHighlightSection } from '@/components/landing/GuidesHighlightSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';
import { TripGrid } from '@/components/trips/TripGrid';
import { useTrips } from '@/hooks/useTrips';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { TripCategory } from '@/types';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const HomePage: React.FC = () => {
  const { openAuth } = useOutletContext<OutletContextValue>();
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | 'ALL'>('ALL');
  const { trips: allTrips, loading: allLoading } = useTrips();
  const { trips: filteredTrips, loading: filteredLoading } = useTrips({
    category: selectedCategory,
  });
  const { profile, toggleFavorite } = useUserProfile();
  const { showToast } = useToast();

  const handleToggleFavorite = async (tripId: string) => {
    try {
      const added = await toggleFavorite(tripId);
      showToast(added ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', 'success');
    } catch {
      showToast('Entre com Google para salvar seus roteiros favoritos.', 'info');
      openAuth('login');
    }
  };

  return (
    <div>
      <HeroSection />

      <FeaturedTripsSection
        trips={allTrips}
        loading={allLoading}
        favorites={profile?.favorites ?? []}
        onToggleFavorite={(id) => void handleToggleFavorite(id)}
      />

      <HowItWorksSection />

      <section className="bg-accent-50 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Explore por estilo de viagem
            </h2>
            <InterestFilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          <TripGrid
            trips={filteredTrips.slice(0, 6)}
            loading={filteredLoading}
            favorites={profile?.favorites ?? []}
            onToggleFavorite={(id) => void handleToggleFavorite(id)}
            onResetFilters={() => setSelectedCategory('ALL')}
          />
        </div>
      </section>

      <GuidesHighlightSection />
      <FaqSection />
      <CtaBannerSection onPartnerSignup={() => openAuth('signup')} />
    </div>
  );
};

export default HomePage;
