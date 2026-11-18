import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useTripDetails } from '@/hooks/useTripDetails';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { BookingCard, ReservePayload } from '@/components/trips/BookingCard';
import { StickyTripBar } from '@/components/trips/StickyTripBar';
import { TripGallery } from '@/components/trips/TripGallery';
import { TripHeader } from '@/components/trips/TripHeader';
import { TripItinerarySection } from '@/components/trips/TripItinerarySection';
import { TripReviewsSection } from '@/components/trips/TripReviewsSection';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const TripDetailsPage: React.FC = () => {
  const { agencySlug, slug, tripSlug } = useParams<{
    agencySlug?: string;
    slug?: string;
    tripSlug?: string;
  }>();
  const targetSlug = tripSlug || slug;
  const navigate = useNavigate();
  const { openAuth } = useOutletContext<OutletContextValue>();
  const { user } = useAuth();
  const { profile, toggleFavorite } = useUserProfile();
  const { createBooking } = useBookings();
  const { showToast } = useToast();
  const { trip, agency, reviews, setReviews, loading, error, reload } = useTripDetails(
    targetSlug,
    agencySlug
  );
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Falha ao carregar roteiro"
          description={error}
          actionLabel="Tentar novamente"
          onAction={() => void reload()}
        />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Roteiro não encontrado"
          description="Este pacote pode ter sido encerrado ou teve seu endereço alterado."
          actionLabel="Explorar catálogo"
          onAction={() => navigate('/trips')}
        />
      </div>
    );
  }

  const isFavorite = Array.isArray(profile?.favorites)
    ? profile.favorites.includes(trip.id)
    : false;

  const handleFavoriteClick = async () => {
    try {
      const added = await toggleFavorite(trip.id);
      showToast(added ? 'Roteiro salvo nos favoritos.' : 'Removido dos favoritos.', 'success');
    } catch {
      showToast('Faça login para salvar favoritos.', 'info');
      openAuth('login');
    }
  };

  const handleReserve = async (payload: ReservePayload) => {
    if (!user) {
      showToast('Faça login para solicitar sua reserva.', 'info');
      openAuth('login');
      return;
    }

    setSubmitting(true);
    try {
      const voucher = `SN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const passengerDetails = [
        {
          name: user.name || 'Titular',
          phone: profile?.phone || '',
          document: profile?.cpf || '',
          type: 'adult' as const,
        },
        ...payload.companions.map((companion, idx) => ({
          name: companion.name.trim() || `Acompanhante ${idx + 1}`,
          type: companion.type,
        })),
      ];

      await createBooking({
        tripId: trip.id,
        tripTitle: trip.title,
        tripSlug: trip.slug || trip.id,
        tripImage: trip.images?.[0] || '',
        agencyId: trip.agencyId,
        agencyName: trip.agencyName,
        clientUid: user.uid,
        clientName: user.name || 'Viajante',
        clientEmail: user.email || '',
        adults: payload.adults,
        children: payload.children,
        totalPrice: payload.totalPrice,
        status: 'PENDING',
        paymentMethod: payload.paymentMethod,
        voucherCode: voucher,
        passengerDetails,
        ...(payload.notes ? { notes: payload.notes } : {}),
      });
      showToast(`Reserva solicitada! Código: ${voucher}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível concluir a reserva.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:py-12">
      <Link
        to={agencySlug ? `/${agencySlug}` : '/trips'}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft size={16} />
        {agencySlug ? `Voltar para ${agency?.name ?? 'agência'}` : 'Voltar para viagens'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-8">
          <TripGallery images={trip.images} title={trip.title} />
          <TripHeader
            trip={trip}
            isFavorite={isFavorite}
            onToggleFavorite={() => void handleFavoriteClick()}
          />
          <TripItinerarySection trip={trip} />
          <TripReviewsSection
            tripId={trip.id}
            agencyId={trip.agencyId}
            reviews={reviews}
            user={user}
            onRequireAuth={() => openAuth('login')}
            onReviewAdded={(created) => setReviews((prev) => [created, ...prev])}
          />
        </div>

        <div id="booking-card" className="lg:col-span-4 scroll-mt-24">
          <BookingCard
            trip={trip}
            agencyWhatsapp={agency?.whatsapp}
            onReserve={handleReserve}
            submitting={submitting}
          />
        </div>
      </div>

      <StickyTripBar
        trip={trip}
        agencyWhatsapp={agency?.whatsapp}
        onScrollToBooking={() =>
          document
            .getElementById('booking-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      />
    </div>
  );
};

export default TripDetailsPage;
