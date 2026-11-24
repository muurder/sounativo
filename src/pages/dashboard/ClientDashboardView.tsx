import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Compass,
  ExternalLink,
  Heart,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBookings } from '@/hooks/useBookings';
import { useTrips } from '@/hooks/useTrips';
import { useAgencies } from '@/hooks/useAgencies';
import { fetchReviewsByUser } from '@/services/reviewService';
import { useToast } from '@/context/ToastContext';
import { Booking, TripReview } from '@/types';
import { formatCurrencyBRL, formatShortDate, getInitials } from '@/utils/formatters';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { TripGrid } from '@/components/trips/TripGrid';
import { ClientBookingsTab } from './ClientBookingsTab';
import { ClientProfileForm } from './ClientProfileForm';
import { PrivacySettings } from './PrivacySettings';
import { BookingVoucherModal } from './BookingVoucherModal';

type ClientTab = 'overview' | 'bookings' | 'favorites' | 'reviews' | 'profile' | 'privacy';

export const ClientDashboardView: React.FC = () => {
  const { logout } = useAuth();
  const { profile, saving, updateProfile, toggleFavorite } = useUserProfile();
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    reload: reloadBookings,
    updateStatus,
  } = useBookings();
  const { allTrips, loading: tripsLoading } = useTrips();
  const { agencies } = useAgencies();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [myReviews, setMyReviews] = useState<TripReview[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    void fetchReviewsByUser(profile.uid).then(setMyReviews);
  }, [profile?.uid]);

  const safeFavorites = useMemo(
    () => (Array.isArray(profile?.favorites) ? profile.favorites : []),
    [profile?.favorites]
  );
  const favoriteTrips = useMemo(
    () => allTrips.filter((t) => Boolean(t?.id && safeFavorites.includes(t.id))),
    [allTrips, safeFavorites]
  );

  const upcomingBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings
      .filter((b) => {
        if (b.status === 'CANCELLED') return false;
        const matchedTrip = allTrips.find((t) => t.id === b.tripId);
        const dateStr = b.departureDate || matchedTrip?.startDate;
        if (!dateStr) return true;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .slice(0, 3);
  }, [allTrips, bookings]);

  const suggestedTrips = useMemo(() => {
    const bookedTripIds = new Set(bookings.map((b) => b.tripId));
    return allTrips.filter((t) => t.isActive && !bookedTripIds.has(t.id)).slice(0, 3);
  }, [allTrips, bookings]);

  const heroBg = useMemo(
    () => getDailyHeroImage(allTrips.map((t) => t.images?.[0]).filter(Boolean)),
    [allTrips]
  );

  const handleToggleFavorite = async (tripId: string) => {
    try {
      const added = await toggleFavorite(tripId);
      showToast(added ? 'Roteiro salvo nos favoritos.' : 'Removido dos favoritos.', 'info');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Não foi possível atualizar seus favoritos.',
        'error'
      );
    }
  };

  const mainNavItems: Array<{
    id: ClientTab;
    label: string;
    badge?: number;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }> = [
    { id: 'overview', label: 'Visão Geral (Feed)', icon: LayoutDashboard },
    { id: 'bookings', label: 'Minhas Viagens', badge: bookings.length, icon: Calendar },
    { id: 'favorites', label: 'Meus Favoritos', badge: favoriteTrips.length, icon: Heart },
    { id: 'reviews', label: 'Minhas Avaliações', badge: myReviews.length, icon: Star },
  ];

  const configNavItems: Array<{
    id: ClientTab;
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }> = [
    { id: 'profile', label: 'Meus Dados & Perfil', icon: UserCheck },
    { id: 'privacy', label: 'Privacidade & LGPD', icon: ShieldCheck },
  ];

  const firstName = (profile?.name || 'Viajante').split(' ')[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Lateral Sidebar Menu (sticky on desktop/tablet) */}
      <aside className="md:col-span-4 lg:col-span-3 md:sticky md:top-20 space-y-5">
        {/* Profile Card */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <div className="relative h-24 bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-600">
            <img
              src={heroBg}
              alt=""
              className="h-full w-full object-cover opacity-35 mix-blend-overlay"
            />
          </div>

          <div className="px-5 pb-4">
            <div className="-mt-10 mb-3 flex items-end justify-between">
              <div className="h-20 w-20 rounded-2xl border-4 border-white bg-primary-600 text-white font-serif text-xl font-bold shadow-md overflow-hidden flex items-center justify-center">
                {profile?.photoURL ? (
                  <SafeImage
                    src={profile.photoURL}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(profile?.name || 'Viajante')
                )}
              </div>
              <Badge tone="success">
                <CheckCircle2 size={11} /> Viajante
              </Badge>
            </div>

            <h2 className="font-serif text-lg font-bold text-stone-900 truncate">
              {profile?.name || 'Viajante SouNativo'}
            </h2>
            <p className="text-xs text-stone-500 truncate">{profile?.email}</p>
          </div>

          {/* 3-Column Quick Stats */}
          <div className="grid grid-cols-3 gap-px bg-stone-200/70 border-t border-stone-200/70">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">{bookings.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Viagens
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">{favoriteTrips.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Favoritos
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">{myReviews.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Avaliações
              </p>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <nav aria-label="Menu do painel do viajante">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors relative border-b border-stone-100 ${
                    isActive ? 'bg-primary-50/80 text-primary-700' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
                  )}
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-3 pb-1 px-4 bg-stone-50/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Configurações
              </p>
            </div>

            {configNavItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors relative ${
                    idx < configNavItems.length - 1 ? 'border-b border-stone-100' : ''
                  } ${
                    isActive ? 'bg-primary-50/80 text-primary-700' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-r" />
                  )}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isActive ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Explore CTA Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-card">
          <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-900/80 to-primary-700/70" />
          <div className="relative p-5 text-white space-y-2.5">
            <Compass size={22} className="text-secondary-300" />
            <h3 className="font-serif text-base font-bold">Explore o Brasil Autêntico</h3>
            <p className="text-xs text-white/85 leading-relaxed">
              Descubra roteiros verificados com guias nativos e agências locais.
            </p>
            <Link
              to="/trips"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-primary-800 hover:bg-stone-100 transition-colors shadow-sm"
            >
              Explorar Viagens <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-xs font-semibold text-stone-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} />
          Sair da Conta
        </button>
      </aside>

      {/* Right Content Area */}
      <div className="md:col-span-8 lg:col-span-9 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Feed Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-primary-200 bg-gradient-to-r from-primary-900 via-primary-800 to-emerald-800 text-white p-6 sm:p-7 shadow-card">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                    <Sparkles size={13} /> Painel do Viajante
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                    Pronto para sua próxima aventura, {firstName}?
                  </h2>
                  <p className="text-xs sm:text-sm text-white/85 max-w-xl">
                    Acompanhe seus vouchers de embarque, converse com as operadoras e explore novos
                    destinos curados pelo SouNativo.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveTab('bookings')}
                  >
                    Ver Minhas Viagens ({bookings.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Upcoming Trips Spotlight */}
            <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Seus Próximos Embarques ({upcomingBookings.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  Ver todas as reservas
                </button>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-stone-800">
                    Nenhuma viagem agendada ainda
                  </p>
                  <p className="text-xs text-stone-500">
                    Escolha seu próximo destino abaixo ou acesse o catálogo completo.
                  </p>
                  <Link
                    to="/trips"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:underline pt-1"
                  >
                    Explorar pacotes disponíveis <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => {
                    const matchedTrip = allTrips.find((t) => t.id === b.tripId);
                    const targetSlug = b.tripSlug || matchedTrip?.slug || b.tripId;
                    const dateStr = b.departureDate || matchedTrip?.startDate;
                    return (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-stone-200 p-4 hover:border-primary-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={b.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                              {b.status === 'CONFIRMED' ? 'Confirmada' : 'Aguardando confirmação'}
                            </Badge>
                            <span className="text-xs font-mono text-stone-500">
                              {b.voucherCode}
                            </span>
                            {dateStr && (
                              <span className="text-xs font-semibold text-primary-700">
                                · Saída: {formatShortDate(dateStr)}
                              </span>
                            )}
                          </div>
                          <Link
                            to={`/viagem/${targetSlug}`}
                            className="inline-flex items-center gap-1 font-serif text-base font-bold text-stone-900 hover:text-primary-600"
                          >
                            {b.tripTitle}
                            <ExternalLink size={13} />
                          </Link>
                          <p className="text-xs text-stone-600">
                            {b.agencyName} · {formatCurrencyBRL(b.totalPrice)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Ticket size={14} />}
                            onClick={() => setSelectedVoucher(b)}
                          >
                            Voucher
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Discovery Feed / Suggested Trips */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    Sugestões Para Sua Próxima Aventura
                  </h3>
                  <p className="text-xs text-stone-500">
                    Experiências autênticas selecionadas para o seu perfil de viajante.
                  </p>
                </div>
                <Link
                  to="/trips"
                  className="text-xs font-semibold text-primary-600 hover:underline"
                >
                  Ver catálogo completo
                </Link>
              </div>

              <TripGrid
                trips={suggestedTrips}
                loading={tripsLoading}
                favorites={safeFavorites}
                onToggleFavorite={(id) => void handleToggleFavorite(id)}
              />
            </section>
          </div>
        )}

        {activeTab === 'bookings' && (
          <ClientBookingsTab
            bookings={bookings}
            trips={allTrips}
            agencies={agencies}
            loading={bookingsLoading}
            error={bookingsError}
            onReload={reloadBookings}
            onUpdateStatus={updateStatus}
          />
        )}

        {activeTab === 'favorites' && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Meus Roteiros Favoritos ({favoriteTrips.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Salve pacotes e experiências para comparar datas e planejar sua próxima viagem.
                </p>
              </div>
              <Link to="/trips">
                <Button size="sm" variant="outline">
                  Explorar mais
                </Button>
              </Link>
            </div>

            <TripGrid
              trips={favoriteTrips}
              loading={tripsLoading}
              favorites={safeFavorites}
              onToggleFavorite={(id) => void handleToggleFavorite(id)}
            />
          </section>
        )}

        {activeTab === 'reviews' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Minhas Avaliações ({myReviews.length})
              </h2>
              <p className="text-xs text-stone-500">
                Suas avaliações de viagens confirmadas ajudam outros viajantes da comunidade
                SouNativo.
              </p>
            </div>

            {myReviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center space-y-2">
                <Star size={28} className="mx-auto text-stone-300" />
                <p className="text-sm font-semibold text-stone-800">
                  Você ainda não publicou avaliações
                </p>
                <p className="text-xs text-stone-500">
                  Após realizar uma viagem confirmada, clique em &ldquo;Avaliar Viagem&rdquo; na aba
                  Minhas Viagens.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map((rev) => {
                  const matchedTrip = allTrips.find((t) => t.id === rev.tripId);
                  return (
                    <div key={rev.id} className="rounded-xl border border-stone-200 p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/viagem/${matchedTrip?.slug || rev.tripId}`}
                          className="font-serif text-base font-bold text-stone-900 hover:text-primary-600"
                        >
                          {matchedTrip?.title || 'Roteiro avaliado'}
                        </Link>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          <Star size={12} className="fill-amber-400 text-amber-500" />
                          {rev.rating}.0
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
                      {rev.createdAt && (
                        <p className="text-[11px] text-stone-400">
                          Publicada em {formatShortDate(rev.createdAt)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <ClientProfileForm profile={profile} saving={saving} onSave={updateProfile} />
        )}

        {activeTab === 'privacy' && <PrivacySettings />}
      </div>

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
