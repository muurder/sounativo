import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BarChart2,
  Binoculars,
  Briefcase,
  Bus,
  CalendarCheck,
  CheckCircle2,
  Compass,
  CreditCard,
  DollarSign,
  ExternalLink,
  Image as ImageIcon,
  ListChecks,
  LogOut,
  Palette,
  Plane,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Star,
  User,
  Users,
  X,
} from 'lucide-react';
import { fetchAgencyByOwner } from '@/services/agencyService';
import { fetchTripsByAgency } from '@/services/tripService';
import { fetchAgencyBookings } from '@/services/bookingService';
import { computeReviewStats, fetchReviewsByAgency } from '@/services/reviewService';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePlanPermissions } from '@/hooks/usePlanPermissions';
import { useToast } from '@/context/ToastContext';
import { Agency, Booking, Trip, TripReview } from '@/types';
import { formatCurrencyBRL, formatShortDate } from '@/utils/formatters';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { TripCreateModal } from './TripCreateModal';
import { PartnerOnboardingForm } from './PartnerOnboardingForm';
import { PartnerTripsSection } from './PartnerTripsSection';
import { PartnerBookingsSection } from './PartnerBookingsSection';
import { PartnerOperationsSection } from './PartnerOperationsSection';
import { PartnerHireGuidesSection } from './PartnerHireGuidesSection';
import { PartnerGuidePortfolioSection } from './PartnerGuidePortfolioSection';
import { PartnerThemeBuilder } from './PartnerThemeBuilder';
import { PartnerProfileForm } from './PartnerProfileForm';
import { PartnerPlansSection } from './PartnerPlansSection';
import { PrivacySettings } from './PrivacySettings';

type PartnerTab =
  | 'overview'
  | 'trips'
  | 'bookings'
  | 'operations'
  | 'portfolio'
  | 'opportunities'
  | 'guides'
  | 'reviews'
  | 'profile'
  | 'theme'
  | 'plans'
  | 'privacy';

export const PartnerDashboardView: React.FC = () => {
  const { logout } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { showToast } = useToast();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PartnerTab>('overview');
  const [selectedOperationalTripId, setSelectedOperationalTripId] = useState<string | null>(null);
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
          const loadedTrips = Array.isArray(tripsRes.value) ? tripsRes.value : [];
          setTrips(loadedTrips);
          if (loadedTrips.length > 0) {
            setSelectedOperationalTripId((prev) => prev ?? loadedTrips[0].id);
          }
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

  const heroBg = useMemo(
    () => getDailyHeroImage(trips.map((t) => t.images?.[0]).filter(Boolean)),
    [trips]
  );

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

  const isGuide = Boolean(agency.isGuide || profile?.role === 'GUIDE');
  const itemSingular = isGuide ? 'Experiência' : 'Pacote';
  const itemSingularLower = isGuide ? 'experiência' : 'pacote';
  const itemPlural = isGuide ? 'Minhas Experiências' : 'Meus Pacotes';

  const showWelcome = !welcomeDismissed && trips.length === 0;

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try {
      window.localStorage.setItem('sounativo_partner_welcome_dismissed', '1');
    } catch {
      // Storage unavailable (private mode)
    }
  };

  const mainNavItems: Array<{
    id: PartnerTab;
    label: string;
    badge?: number;
    highlightBadge?: boolean;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }> = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
    { id: 'trips', label: itemPlural, badge: trips.length, icon: Plane },
    {
      id: 'bookings',
      label: isGuide ? 'Reservas & Agenda' : 'Reservas',
      badge: metrics.pendingCount > 0 ? metrics.pendingCount : bookings.length,
      highlightBadge: metrics.pendingCount > 0,
      icon: ListChecks,
    },
    { id: 'operations', label: 'Operacional', icon: Bus },
    ...(isGuide
      ? [
          {
            id: 'portfolio' as const,
            label: 'Meu Portfólio & Cadastur',
            icon: ImageIcon,
          },
          {
            id: 'opportunities' as const,
            label: 'Oportunidades & Agências',
            icon: Briefcase,
          },
        ]
      : [
          {
            id: 'guides' as const,
            label: 'Contratar Guias',
            icon: Binoculars,
          },
        ]),
    { id: 'reviews', label: 'Avaliações', badge: reviews.length, icon: Star },
  ];

  const configNavItems: Array<{
    id: PartnerTab;
    label: string;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }> = [
    { id: 'profile', label: 'Meu Perfil & Credencial', icon: User },
    { id: 'theme', label: 'Aparência do Microsite', icon: Palette },
    { id: 'plans', label: 'Plano & Assinatura', icon: CreditCard },
    { id: 'privacy', label: 'Privacidade & LGPD', icon: ShieldCheck },
  ];

  const openNewTripModal = () => {
    setEditingTrip(null);
    setCreateOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Lateral Sidebar Menu (sticky on desktop/tablet) */}
      <aside className="md:col-span-4 lg:col-span-3 md:sticky md:top-20 space-y-5">
        {/* Partner Profile Card */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <div className="relative h-24 bg-gradient-to-br from-primary-800 via-primary-700 to-emerald-700">
            <img
              src={agency.heroBannerUrl || heroBg}
              alt=""
              className="h-full w-full object-cover opacity-40 mix-blend-overlay"
            />
          </div>

          <div className="px-5 pb-4">
            <div className="-mt-10 mb-3 flex items-end justify-between gap-2">
              <div className="h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                <SafeImage
                  src={agency.logo}
                  alt={agency.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <Badge tone="success">
                <CheckCircle2 size={11} />
                {isGuide ? 'Guia de Turismo' : 'Agência Parceira'}
              </Badge>
            </div>

            <h2 className="font-serif text-lg font-bold text-stone-900 truncate">{agency.name}</h2>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="primary">
                {isGuide ? <Award size={11} /> : <ShieldCheck size={11} />}
                Plano {permissions.planName}
              </Badge>
              <Link
                to={`/${agency.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
              >
                /{agency.slug} <ExternalLink size={11} />
              </Link>
            </div>
          </div>

          {/* 3-Column Quick Stats Row */}
          <div className="grid grid-cols-3 gap-px bg-stone-200/70 border-t border-stone-200/70">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">
                {metrics.activeBookingsCount}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Reservas
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">{activeTripsCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Ativos
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className="bg-white py-3.5 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-lg font-bold text-stone-900">{reviews.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Avaliações
              </p>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <nav aria-label={`Menu do painel de ${isGuide ? 'guia' : 'agência'}`}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors relative border-b border-stone-100 ${
                    isActive
                      ? 'bg-primary-50/80 text-primary-700'
                      : 'text-stone-700 hover:bg-stone-50'
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
                        item.highlightBadge
                          ? 'bg-amber-500 text-white'
                          : isActive
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
                    isActive
                      ? 'bg-primary-50/80 text-primary-700'
                      : 'text-stone-700 hover:bg-stone-50'
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

        {/* Create New Trip CTA Card (Restored from AgencyDashboard) */}
        <div className="relative rounded-2xl overflow-hidden shadow-card">
          <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-900/80 to-primary-700/70" />
          <div className="relative p-5 text-white space-y-2.5">
            <Plus size={22} className="text-secondary-300" />
            <h3 className="font-serif text-base font-bold">
              {isGuide ? 'Publicar Nova Experiência' : 'Criar Novo Pacote'}
            </h3>
            <p className="text-xs text-white/85 leading-relaxed">
              Adicione um novo roteiro ao seu microsite e vitrine nacional.
            </p>
            <button
              type="button"
              disabled={!permissions.canPublishMoreTrips}
              onClick={openNewTripModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-primary-800 hover:bg-stone-100 disabled:opacity-60 transition-colors shadow-sm"
            >
              {isGuide ? 'Criar Experiência' : 'Criar Pacote'} <ArrowRight size={13} />
            </button>
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
        {/* Welcome Banner on First Access */}
        {showWelcome && (
          <div className="rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 via-white to-secondary-50 p-5 shadow-card flex items-start gap-4">
            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white">
              <Rocket size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Sua conta de {isGuide ? 'Guia de Turismo' : 'Agência Parceira'} está ativa!
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Seu microsite <code>/{agency.slug}</code> já está no ar. O próximo passo é publicar
                {isGuide ? ' sua primeira experiência' : ' seu primeiro pacote'} para aparecer nas
                buscas do SouNativo.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  disabled={!permissions.canPublishMoreTrips}
                  onClick={openNewTripModal}
                >
                  {isGuide ? 'Publicar minha primeira experiência' : 'Publicar meu primeiro pacote'}
                </Button>
                <Link to={`/${agency.slug}`}>
                  <Button size="sm" variant="outline">
                    Ver meu microsite
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveTab(isGuide ? 'portfolio' : 'theme')}
                >
                  {isGuide ? 'Completar meu Portfólio' : 'Personalizar identidade'}
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

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Workspace Header */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">
                    {isGuide ? <Award size={12} /> : <ShieldCheck size={12} />}
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
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  Visão Geral — {agency.name}
                </h2>
              </div>

              <Button
                leftIcon={<Plus size={16} />}
                disabled={!permissions.canPublishMoreTrips}
                onClick={openNewTripModal}
              >
                {isGuide ? 'Nova Experiência' : 'Novo Pacote'} ({activeTripsCount}/
                {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'})
              </Button>
            </div>

            {/* 4 Clickable KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
              >
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
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>Reservas &amp; Embarques</span>
                  <CalendarCheck size={16} className="text-primary-600" />
                </div>
                <p className="font-serif text-2xl font-bold text-stone-900">
                  {metrics.activeBookingsCount}
                </p>
                <p className="text-xs text-stone-500">
                  {metrics.pendingCount} pendente(s) · {metrics.confirmedPassengers} viajantes
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trips')}
                className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>{isGuide ? 'Experiências Ativas' : 'Pacotes Publicados'}</span>
                  <Compass size={16} className="text-secondary-600" />
                </div>
                <p className="font-serif text-2xl font-bold text-stone-900">
                  {activeTripsCount} /{' '}
                  {Number.isFinite(permissions.maxTrips) ? permissions.maxTrips : '∞'}
                </p>
                <p className="text-xs text-stone-500">
                  {trips.length} {isGuide ? 'experiências' : 'pacotes'} no total
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
                  <span>Reputação &amp; Nota</span>
                  <Users size={16} className="text-amber-500" />
                </div>
                <p className="font-serif text-2xl font-bold text-stone-900">
                  {metrics.reviewStats.totalReviews > 0
                    ? `${metrics.reviewStats.rating} ★`
                    : 'Sem notas'}
                </p>
                <p className="text-xs text-stone-500">
                  {metrics.reviewStats.totalReviews} avaliação(ões) recebida(s)
                </p>
              </button>
            </div>

            {/* Overview 2-Column Split: Recent Bookings + Top Trips / Guide Tips (Restored from OverviewTab.tsx) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <ListChecks size={18} className="text-primary-600" /> Últimas Reservas Recebidas
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Ver todas ({bookings.length})
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4">
                    Nenhuma reserva solicitada ainda. Assim que um viajante reservar seu{' '}
                    {itemSingularLower}, o voucher aparecerá aqui.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {bookings.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-stone-200 p-3.5"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              tone={
                                b.status === 'CONFIRMED'
                                  ? 'success'
                                  : b.status === 'CANCELLED'
                                    ? 'warning'
                                    : 'secondary'
                              }
                            >
                              {b.status === 'CONFIRMED'
                                ? 'Confirmada'
                                : b.status === 'CANCELLED'
                                  ? 'Cancelada'
                                  : 'Pendente'}
                            </Badge>
                            <span className="text-xs font-mono text-stone-500">
                              {b.voucherCode}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-stone-900 truncate">{b.tripTitle}</p>
                          <p className="text-xs text-stone-500">
                            {b.clientName} · {b.adults ?? 1} passageiro(s)
                            {b.departureDate ? ` · Saída ${formatShortDate(b.departureDate)}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-serif text-base font-bold text-primary-700">
                            {formatCurrencyBRL(b.totalPrice)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab('bookings')}
                          >
                            Gerenciar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      {isGuide ? 'Destaques do Portfólio' : 'Top Pacotes'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('trips')}
                      className="text-xs font-bold text-primary-600 hover:underline"
                    >
                      Gerenciar
                    </button>
                  </div>

                  {trips.length === 0 ? (
                    <div className="space-y-2 text-xs text-stone-500">
                      <p>Nenhum {itemSingularLower} publicado ainda.</p>
                      <Button
                        size="sm"
                        fullWidth
                        leftIcon={<Plus size={14} />}
                        onClick={openNewTripModal}
                      >
                        Publicar {itemSingular}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trips.slice(0, 4).map((t) => (
                        <div key={t.id} className="flex items-center gap-3">
                          <div className="h-12 w-14 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                            <SafeImage
                              src={t.images?.[0]}
                              alt={t.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/viagem/${t.slug}`}
                              className="block text-xs font-bold text-stone-900 hover:text-primary-600 truncate"
                            >
                              {t.title}
                            </Link>
                            <p className="text-[11px] text-stone-500">
                              {formatCurrencyBRL(t.price)} ·{' '}
                              {t.availableSpots ?? t.maxGuests}/{t.maxGuests} vagas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isGuide && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 space-y-2 text-blue-950">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Award size={15} className="text-blue-600" /> Dica para Guias de Turismo
                    </p>
                    <p className="text-xs text-blue-900/90 leading-relaxed">
                      Mantenha seus idiomas, especialidades e Cadastur completos na aba
                      &ldquo;Portfólio&rdquo; para ser encontrado por agências e viajantes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('portfolio')}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      Editar meu Portfólio &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: TRIPS (MEUS PACOTES / MINHAS EXPERIÊNCIAS) */}
        {activeTab === 'trips' && (
          <PartnerTripsSection
            trips={trips}
            agency={agency}
            isGuide={isGuide}
            canPublishMoreTrips={permissions.canPublishMoreTrips}
            onCreateNew={openNewTripModal}
            onEdit={(trip) => {
              setEditingTrip(trip);
              setCreateOpen(true);
            }}
            onOpenOperations={(tripId) => {
              setSelectedOperationalTripId(tripId);
              setActiveTab('operations');
            }}
            onTripCreated={(created) => setTrips((prev) => [created, ...prev])}
            onTripUpdated={(updated) =>
              setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            }
            onTripDeleted={(tripId) =>
              setTrips((prev) => prev.filter((item) => item.id !== tripId))
            }
          />
        )}

        {/* TAB: BOOKINGS (RESERVAS) */}
        {activeTab === 'bookings' && (
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
        )}

        {/* TAB: OPERATIONS (TRANSPORTE, HOSPEDAGEM & MANIFESTO) */}
        {activeTab === 'operations' && (
          <PartnerOperationsSection
            trips={trips}
            bookings={bookings}
            isGuide={isGuide}
            selectedTripId={selectedOperationalTripId}
            onSelectTrip={setSelectedOperationalTripId}
            onTripUpdated={(updated) =>
              setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
            }
          />
        )}

        {/* TAB: GUIDE PORTFOLIO */}
        {activeTab === 'portfolio' && (
          <PartnerGuidePortfolioSection
            agency={agency}
            mode="portfolio"
            onUpdated={(updatedAgency) => setAgency(updatedAgency)}
          />
        )}

        {/* TAB: GUIDE OPPORTUNITIES */}
        {activeTab === 'opportunities' && (
          <PartnerGuidePortfolioSection
            agency={agency}
            mode="opportunities"
            onUpdated={(updatedAgency) => setAgency(updatedAgency)}
          />
        )}

        {/* TAB: HIRE GUIDES (FOR AGENCIES) */}
        {activeTab === 'guides' && <PartnerHireGuidesSection />}

        {/* TAB: REVIEWS */}
        {activeTab === 'reviews' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Avaliações Recebidas ({reviews.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Feedback verificados de viajantes que embarcaram com {agency.name}.
                </p>
              </div>
              {metrics.reviewStats.totalReviews > 0 && (
                <Badge tone="secondary">
                  <Star size={12} className="fill-amber-400 text-amber-500" />
                  Média {metrics.reviewStats.rating} ({metrics.reviewStats.totalReviews})
                </Badge>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-stone-500">
                Nenhuma avaliação recebida para seus roteiros ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => {
                  const matchedTrip = trips.find((t) => t.id === rev.tripId);
                  return (
                    <div key={rev.id} className="rounded-xl border border-stone-200 p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-stone-900">
                            {rev.userName}
                          </span>
                          {matchedTrip && (
                            <span className="ml-2 text-xs text-stone-500">
                              · {matchedTrip.title}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {rev.rating}.0
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB: PROFILE & CREDENTIAL */}
        {activeTab === 'profile' && (
          <PartnerProfileForm
            agency={agency}
            currentRole={profile?.role}
            onChangeRole={async (nextRole) => {
              await updateProfile({ role: nextRole });
            }}
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
        )}

        {/* TAB: THEME & MICROSITE APPEARANCE */}
        {activeTab === 'theme' && (
          <PartnerThemeBuilder
            agency={agency}
            canCustomizeTheme={permissions.canCustomizeTheme}
            onThemeUpdated={(theme) => setAgency((prev) => (prev ? { ...prev, theme } : prev))}
          />
        )}

        {/* TAB: PLANS & SUBSCRIPTION */}
        {activeTab === 'plans' && (
          <PartnerPlansSection
            agency={agency}
            onPlanUpdated={(updates) => setAgency((prev) => (prev ? { ...prev, ...updates } : prev))}
          />
        )}

        {/* TAB: PRIVACY & LGPD */}
        {activeTab === 'privacy' && <PrivacySettings />}
      </div>

      <TripCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditingTrip(null);
        }}
        agency={agency}
        canPublishMoreTrips={permissions.canPublishMoreTrips}
        editingTrip={editingTrip}
        onCreated={(created) => {
          setTrips((prev) => [created, ...prev]);
          setSelectedOperationalTripId((prev) => prev ?? created.id);
        }}
        onUpdated={(updated) =>
          setTrips((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
      />
    </div>
  );
};
