import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  CalendarCheck,
  Compass,
  DollarSign,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import { fetchAgencyByOwner } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { fetchAgencyBookings } from '@/services/bookingService';
import { computeReviewStats, fetchReviewsByAgency } from '@/services/reviewService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useToast } from '@/context/ToastContext';
import { Agency, Booking, Trip, TripReview } from '@/types';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TripCreateModal } from './TripCreateModal';
import { PartnerOnboardingForm } from './PartnerOnboardingForm';
import { PartnerTripsSection } from './PartnerTripsSection';
import { PartnerBookingsSection } from './PartnerBookingsSection';
import { PartnerThemeBuilder } from './PartnerThemeBuilder';
import { PartnerProfileForm } from './PartnerProfileForm';
import { PartnerPlansSection } from './PartnerPlansSection';

type PartnerTab = 'operations' | 'microsite' | 'plans';

export const PartnerDashboardView: React.FC = () => {
  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PartnerTab>('operations');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('sounativo_partner_welcome_dismissed') === '1';
    } catch {
      return false;
    }
  });

  const activeTripsCount = trips.filter((t) => t?.isActive).length;
  const permissions = usePlanPermissions(
    agency?.subscriptionPlan,
    activeTripsCount,
    agency?.subscriptionStatus
  );

  const loadPartnerWorkspace = useCallback(async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const found = await fetchAgencyByOwner(profile.uid);
      setAgency(found);

      if (found) {
        const [tripsRes, bookingsRes, reviewsRes] = await Promise.allSettled([
          fetchTripsByAgency(found.id, true),
          fetchAgencyBookings(found.id),
          fetchReviewsByAgency(found.id),
        ]);

        if (tripsRes.status === 'fulfilled') {
          setTrips(Array.isArray(tripsRes.value) ? tripsRes.value : []);
        } else {
          showToast(
            tripsRes.reason instanceof Error
              ? tripsRes.reason.message
              : 'Não foi possível carregar seus pacotes.',
            'error'
          );
        }

        if (bookingsRes.status === 'fulfilled') {
          setBookings(Array.isArray(bookingsRes.value) ? bookingsRes.value : []);
        } else {
          showToast(
            bookingsRes.reason instanceof Error
              ? bookingsRes.reason.message
              : 'Não foi possível carregar as reservas recebidas.',
            'error'
          );
        }

        if (reviewsRes.status === 'fulfilled') {
          setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
        }
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Não foi possível consultar os dados da sua agência no momento.'
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.uid, showToast]);

  useEffect(() => {
    void loadPartnerWorkspace();
  }, [loadPartnerWorkspace]);

  const metrics = useMemo(() => {
    const confirmedRevenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const pendingRevenue = bookings
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
    const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;
    const activeBookingsCount = bookings.length - cancelledCount;
    const confirmedPassengers = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + (b.adults ?? 1) + (b.children ?? 0), 0);
    const reviewStats = computeReviewStats(reviews);

    return {
      confirmedRevenue,
      pendingRevenue,
      pendingCount,
      cancelledCount,
      activeBookingsCount,
      confirmedPassengers,
      reviewStats,
    };
  }, [bookings, reviews]);

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando painel do parceiro...</p>;
  }

  if (loadError && !agency) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50/70 p-6 space-y-4 max-w-xl"
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-bold text-red-950">
              Falha ao consultar seu microsite
            </h2>
            <p className="text-xs text-red-900/90 leading-relaxed">{loadError}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw size={14} />}
          onClick={() => void loadPartnerWorkspace()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!agency && profile) {
    return (
      <PartnerOnboardingForm
        profile={profile}
        onUpdateProfile={(updates) => updateProfile(updates)}
        onCreated={(created) => setAgency(created)}
      />
    );
  }

  if (!agency) return null;

  const showWelcome = !welcomeDismissed && trips.length === 0;

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try {
      window.localStorage.setItem('sounativo_partner_welcome_dismissed', '1');
    } catch {
      // Storage unavailable (private mode) — dismissal stays in memory for this session.
    }
  };

  return (
    <div className="space-y-6">
      {showWelcome && (
        <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-secondary-50 p-5 shadow-card flex items-start gap-4">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
            <Rocket size={20} />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Sua conta de parceiro está ativa!
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Seu microsite <code>/{agency.slug}</code> já está no ar. O próximo passo é publicar
              seu primeiro roteiro para aparecer nas buscas do SouNativo.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                leftIcon={<Plus size={14} />}
                disabled={!permissions.canPublishMoreTrips}
                onClick={() => {
                  setEditingTrip(null);
                  setCreateOpen(true);
                }}
              >
                Publicar meu primeiro roteiro
              </Button>
              <Link to={`/${agency.slug}`}>
                <Button size="sm" variant="outline">
                  Ver meu microsite
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('microsite')}>
                Personalizar identidade
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissWelcome}
            aria-label="Fechar boas-vindas"
            className="min-w-[36px] min-h-[36px] -mr-1 -mt-1 inline-flex items-center justify-center rounded-full text-stone-500 hover:bg-white hover:text-stone-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">
              {agency.isGuide ? <Award size={12} /> : <ShieldCheck size={12} />}
              Plano {permissions.planName}
            </Badge>
            {agency.subscriptionStatus === 'PENDING' && (
              <Badge tone="warning">Upgrade aguardando aprovação</Badge>
            )}
            <Link
              to={`/${agency.slug}`}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              Ver meu microsite /{agency.slug}
            </Link>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">{agency.name}</h2>
        </div>

        <Button
          leftIcon={<Plus size={16} />}
          disabled={!permissions.canPublishMoreTrips}
          onClick={() => {
            setEditingTrip(null);
            setCreateOpen(true);
          }}
        >
          Novo Pacote ({activeTripsCount}/
          {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'})
        </Button>
      </div>

      {/* Partner KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Receita Confirmada</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">
            {formatCurrencyBRL(metrics.confirmedRevenue)}
          </p>
          <p className="text-xs text-stone-500">
            {formatCurrencyBRL(metrics.pendingRevenue)} aguardando confirmação
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Reservas &amp; Embarques</span>
            <CalendarCheck size={16} className="text-primary-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">
            {metrics.activeBookingsCount}
          </p>
          <p className="text-xs text-stone-500">
            {metrics.pendingCount} pendente(s) · {metrics.confirmedPassengers} viajantes confirmados
            {metrics.cancelledCount > 0 ? ` · ${metrics.cancelledCount} cancelada(s)` : ''}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Roteiros Publicados</span>
            <Compass size={16} className="text-secondary-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">
            {activeTripsCount} /{' '}
            {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'}
          </p>
          <p className="text-xs text-stone-500">{trips.length} roteiros no total</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Reputação &amp; Reviews</span>
            <Users size={16} className="text-amber-500" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">
            {metrics.reviewStats.totalReviews > 0 ? `${metrics.reviewStats.rating} ★` : 'Sem notas'}
          </p>
          <p className="text-xs text-stone-500">
            {metrics.reviewStats.totalReviews} avaliação(ões) recebida(s)
          </p>
        </div>
      </div>

      {/* Partner Sub-Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'operations' as const, label: 'Roteiros, Reservas & Avaliações' },
          { id: 'microsite' as const, label: 'Microsite, Tema & Credencial' },
          { id: 'plans' as const, label: 'Plano & Assinatura' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'operations' && (
        <div className="space-y-6">
          <PartnerTripsSection
            trips={trips}
            canPublishMoreTrips={permissions.canPublishMoreTrips}
            onEdit={(trip) => {
              setEditingTrip(trip);
              setCreateOpen(true);
            }}
            onTripUpdated={(updated) =>
              setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            }
            onTripDeleted={(tripId) =>
              setTrips((prev) => prev.filter((item) => item.id !== tripId))
            }
          />

          <PartnerBookingsSection
            bookings={bookings}
            onBookingUpdated={(bookingId, status, cancellationReason) => {
              setBookings((prev) =>
                prev.map((item) =>
                  item.id === bookingId
                    ? {
                        ...item,
                        status,
                        ...(cancellationReason ? { cancellationReason } : {}),
                      }
                    : item
                )
              );
              void fetchTripsByAgency(agency.id, true)
                .then((freshTrips) => {
                  if (Array.isArray(freshTrips)) setTrips(freshTrips);
                })
                .catch(() => {});
            }}
          />

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Avaliações Recebidas ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nenhuma avaliação recebida para seus roteiros ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-stone-200 p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900">{rev.userName}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        {rev.rating}.0
                      </span>
                    </div>
                    <p className="text-xs text-stone-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'microsite' && (
        <div className="space-y-6">
          <PartnerThemeBuilder
            agency={agency}
            canCustomizeTheme={permissions.canCustomizeTheme}
            onThemeUpdated={(theme) => setAgency((prev) => (prev ? { ...prev, theme } : prev))}
          />
          <PartnerProfileForm
            agency={agency}
            onUpdated={(updatedAgency) => {
              setAgency(updatedAgency);
              setTrips((prev) =>
                prev.map((item) => ({
                  ...item,
                  agencyName: updatedAgency.name,
                }))
              );
            }}
          />
        </div>
      )}

      {activeTab === 'plans' && (
        <PartnerPlansSection
          agency={agency}
          onPlanUpdated={(updates) => setAgency((prev) => (prev ? { ...prev, ...updates } : prev))}
        />
      )}

      <TripCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingTrip(null);
        }}
        agency={agency}
        canPublishMoreTrips={permissions.canPublishMoreTrips}
        editingTrip={editingTrip}
        onCreated={(created) => setTrips((prev) => [created, ...prev])}
        onUpdated={(updated) =>
          setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
      />
    </div>
  );
};
