import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Heart, MapPin, ShieldCheck, Star, XCircle } from 'lucide-react';
import { fetchAgencyBySlug } from '@/services/agencyService';
import { fetchReviewsForTrip, fetchTripBySlugOrId } from '@/services/tripService';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';
import { Agency, PaymentMethod, Trip, TripReview } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { BookingCard } from '@/components/trips/BookingCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';

interface OutletContextValue {
  openAuth: (mode: 'login' | 'signup') => void;
}

export const TripDetailsPage: React.FC = () => {
  const { slug, tripSlug } = useParams<{ slug?: string; tripSlug?: string }>();
  const targetSlug = tripSlug || slug;
  const navigate = useNavigate();
  const { openAuth } = useOutletContext<OutletContextValue>();
  const { user } = useAuth();
  const { profile, toggleFavorite } = useUserProfile();
  const { createBooking } = useBookings();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!targetSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTripBySlugOrId(targetSlug)
      .then(async (found) => {
        if (!active) return;
        setTrip(found);
        if (found) {
          const [foundAgency, foundReviews] = await Promise.all([
            fetchAgencyBySlug(found.agencySlug),
            fetchReviewsForTrip(found.id),
          ]);
          if (active) {
            setAgency(foundAgency);
            setReviews(foundReviews);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [targetSlug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-3xl" />
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

  const isFavorite = profile?.favorites.includes(trip.id) ?? false;

  const handleReserve = async (payload: {
    adults: number;
    children: number;
    totalPrice: number;
    paymentMethod: PaymentMethod;
  }) => {
    if (!user) {
      showToast('Faça login com Google para solicitar sua reserva.', 'info');
      openAuth('login');
      return;
    }

    setSubmitting(true);
    try {
      const voucher = `SN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await createBooking({
        tripId: trip.id,
        tripTitle: trip.title,
        tripSlug: trip.slug,
        tripImage: trip.images[0] || '',
        agencyId: trip.agencyId,
        agencyName: trip.agencyName,
        clientUid: user.uid,
        clientName: user.name,
        clientEmail: user.email,
        adults: payload.adults,
        children: payload.children,
        totalPrice: payload.totalPrice,
        status: 'PENDING',
        paymentMethod: payload.paymentMethod,
        voucherCode: voucher,
        passengerDetails: [
          {
            name: user.name,
            phone: profile?.phone || '',
            document: profile?.cpf || '',
            type: 'adult',
          },
        ],
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        to="/trips"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft size={16} /> Voltar para viagens
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 aspect-[16/9]">
            <img src={trip.images[0]} alt={trip.title} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="secondary">{CATEGORY_LABELS[trip.category]}</Badge>
                <Badge tone="primary">
                  <Star size={12} className="fill-current" /> {trip.rating.toFixed(1)} (
                  {trip.totalReviews})
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => void toggleFavorite(trip.id).catch(() => openAuth('login'))}
                className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:border-secondary-300"
              >
                <Heart
                  size={16}
                  className={cn(
                    isFavorite ? 'fill-secondary-500 text-secondary-500' : 'text-stone-500'
                  )}
                />
                {isFavorite ? 'Salvo nos favoritos' : 'Salvar roteiro'}
              </button>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin size={16} className="text-secondary-600" />
                {trip.destination}
              </span>
              <Link
                to={`/${trip.agencySlug}`}
                className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:underline"
              >
                <ShieldCheck size={16} />
                Operado por {trip.agencyName}
              </Link>
            </div>

            <p className="text-base text-stone-700 leading-relaxed pt-2">{trip.description}</p>
          </div>

          {trip.itinerary.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">Roteiro Dia a Dia</h2>
              <div className="space-y-4">
                {trip.itinerary.map((step) => (
                  <div key={step.day} className="flex gap-4">
                    <span className="h-9 w-9 rounded-full bg-primary-50 text-primary-700 font-bold text-sm flex items-center justify-center shrink-0">
                      D{step.day}
                    </span>
                    <div>
                      <h3 className="font-semibold text-stone-900">{step.title}</h3>
                      <p className="text-sm text-stone-600 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">
                O que está incluído
              </h2>
              <ul className="space-y-2.5 text-sm text-stone-700">
                {trip.included.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={17} className="text-primary-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Não inclui</h2>
              <ul className="space-y-2.5 text-sm text-stone-600">
                {trip.notIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle size={17} className="text-stone-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {reviews.length > 0 && (
            <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Avaliações de Viajantes
              </h2>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-stone-900">
                        {review.userName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {review.rating}.0
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4">
          <BookingCard
            trip={trip}
            agencyWhatsapp={agency?.whatsapp}
            onReserve={handleReserve}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
};

export default TripDetailsPage;
