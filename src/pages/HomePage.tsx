import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HeroSection } from '@/components/landing/HeroSection';
import { BiomesDiscoverySection } from '@/components/landing/BiomesDiscoverySection';
import { UpcomingTripsSection } from '@/components/landing/UpcomingTripsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhySouNativoSection } from '@/components/landing/WhySouNativoSection';
import { ReviewsShowcaseSection } from '@/components/landing/ReviewsShowcaseSection';
import { GroupQuoteSection } from '@/components/landing/GroupQuoteSection';
import { GuidesHighlightSection } from '@/components/landing/GuidesHighlightSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaBannerSection } from '@/components/landing/CtaBannerSection';
import { useTrips } from '@/hooks/useTrips';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const HomePage: React.FC = () => {
  const { openAuth } = useOutletContext<OutletContextValue>();
  const { allTrips, loading } = useTrips();
  const { profile, toggleFavorite } = useUserProfile();
  const { showToast } = useToast();

  const featuredHero = useMemo(
    () => allTrips.find((trip) => trip.featured) ?? allTrips[0],
    [allTrips]
  );

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
      <HeroSection highlightTrip={featuredHero} />
      <BiomesDiscoverySection />
      <UpcomingTripsSection
        trips={allTrips}
        loading={loading}
        favorites={profile?.favorites ?? []}
        onToggleFavorite={(id) => void handleToggleFavorite(id)}
      />
      <HowItWorksSection />
      <WhySouNativoSection />
      <ReviewsShowcaseSection trips={allTrips} />
      <GroupQuoteSection />
      <GuidesHighlightSection />
      <FaqSection />
      <CtaBannerSection onPartnerSignup={() => openAuth('signup')} />
    </div>
  );
};

export default HomePage;
