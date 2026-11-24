import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarCheck,
  Clock,
  Compass,
  ExternalLink,
  Inbox,
  Plane,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AdminErrorLogRecord,
  AdminManagedAgency,
  AdminManagedUser,
  deleteContactMessageAsAdmin,
  deleteErrorLogAsAdmin,
  deleteReviewAsAdmin,
  deleteTripAsAdmin,
  fetchAllAgenciesForAdmin,
  fetchAllBookingsForAdmin,
  fetchAllContactMessagesForAdmin,
  fetchAllReviewsForAdmin,
  fetchAllTripsForAdmin,
  fetchAllUsersForAdmin,
  fetchErrorLogsForAdmin,
  updateAgencyAdminControls,
  updateContactMessageStatusAsAdmin,
  updateTripAdminControls,
  updateUserRoleAsAdmin,
} from '@/services/adminService';
import { updateBookingStatusInFirestore } from '@/services/bookingService';
import { ContactMessageRecord, ContactMessageStatus } from '@/services/contactService';
import { createNotificationInFirestore } from '@/services/notificationService';
import {
  Booking,
  BookingStatus,
  PlanTier,
  SubscriptionStatus,
  Trip,
  TripReview,
  UserRole,
} from '@/types';
import { formatCurrencyBRL, formatShortDate } from '@/utils/formatters';
import { formatUserRoleLabel } from '@/utils/dashboardRouting';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { AdminCatalogSection } from './AdminCatalogSection';
import { AdminOperationsSection } from './AdminOperationsSection';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'CLIENT', label: 'Viajante / Cliente' },
  { value: 'AGENCY', label: 'Agência de Turismo' },
  { value: 'GUIDE', label: 'Guia de Turismo' },
  { value: 'ADMIN', label: 'Administrador Master' },
];

type AdminTab = 'overview' | 'users' | 'agencies' | 'trips' | 'operations';

export const AdminDashboardView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [agencies, setAgencies] = useState<AdminManagedAgency[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageRecord[]>([]);
  const [reviews, setReviews] = useState<TripReview[]>([]);
  const [errorLogs, setErrorLogs] = useState<AdminErrorLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyUserUid, setBusyUserUid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const loadAdminConsole = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const results = await Promise.allSettled([
        fetchAllUsersForAdmin(),
        fetchAllAgenciesForAdmin(),
        fetchAllTripsForAdmin(),
        fetchAllBookingsForAdmin(),
        fetchAllContactMessagesForAdmin(),
        fetchAllReviewsForAdmin(),
        fetchErrorLogsForAdmin(),
      ]);

      const [uRes, aRes, tRes, bRes, cRes, rRes, eRes] = results;
      const errors: string[] = [];

      if (uRes.status === 'fulfilled') setUsers(uRes.value);
      else errors.push(uRes.reason instanceof Error ? uRes.reason.message : 'Falha em usuários');

      if (aRes.status === 'fulfilled') setAgencies(aRes.value);
      else errors.push(aRes.reason instanceof Error ? aRes.reason.message : 'Falha em agências');

      if (tRes.status === 'fulfilled') setTrips(tRes.value);
      else errors.push(tRes.reason instanceof Error ? tRes.reason.message : 'Falha em pacotes');

      if (bRes.status === 'fulfilled') setBookings(bRes.value);
      else errors.push(bRes.reason instanceof Error ? bRes.reason.message : 'Falha em reservas');

      if (cRes.status === 'fulfilled') setContactMessages(cRes.value);
      else errors.push(cRes.reason instanceof Error ? cRes.reason.message : 'Falha em leads');

      if (rRes.status === 'fulfilled') setReviews(rRes.value);
      else errors.push(rRes.reason instanceof Error ? rRes.reason.message : 'Falha em avaliações');

      if (eRes.status === 'fulfilled') setErrorLogs(eRes.value);

      if (errors.length > 0) {
        const summary = errors[0];
        setLoadError(summary);
        showToast(summary, 'error');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Sem permissão Admin no Firestore. Publique as rules atualizadas.';
      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAdminConsole();
  }, [loadAdminConsole]);

  const metrics = useMemo(() => {
    const confirmedRevenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
    const pendingUpgrades = agencies.filter((a) => a.subscriptionStatus === 'PENDING').length;
    const newLeads = contactMessages.filter((m) => m.status === 'NEW').length;
    const activeTrips = trips.filter((t) => t.isActive).length;
    const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;
    const guidesCount = agencies.filter((a) => a.isGuide).length;
    const agenciesOnlyCount = agencies.length - guidesCount;
    const premiumCount = agencies.filter((a) => a.subscriptionPlan === 'PREMIUM').length;
    const basicCount = agencies.filter((a) => a.subscriptionPlan === 'BASIC').length;
    const estimatedMrr = premiumCount * 149 + basicCount * 69;

    return {
      confirmedRevenue,
      pendingBookings,
      pendingUpgrades,
      newLeads,
      activeTrips,
      suspendedUsers,
      guidesCount,
      agenciesOnlyCount,
      premiumCount,
      basicCount,
      estimatedMrr,
    };
  }, [agencies, bookings, contactMessages, trips, users]);

  const handleRoleChange = async (uid: string, role: UserRole, status?: 'ACTIVE' | 'SUSPENDED') => {
    setBusyUserUid(uid);
    try {
      await updateUserRoleAsAdmin(uid, role, status);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role, ...(status ? { status } : {}) } : u))
      );
      showToast(
        status ? `Conta atualizada (${role} · ${status}).` : `Papel atualizado para ${role}.`,
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar usuário.', 'error');
    } finally {
      setBusyUserUid(null);
    }
  };

  const handleAgencyControl = async (
    agencyId: string,
    updates: {
      verified?: boolean;
      isActive?: boolean;
      subscriptionPlan?: PlanTier;
      requestedPlan?: PlanTier | null;
      subscriptionStatus?: SubscriptionStatus;
    }
  ) => {
    try {
      await updateAgencyAdminControls(agencyId, updates);
      const nextSubStatus =
        updates.subscriptionStatus ?? (updates.subscriptionPlan ? 'ACTIVE' : undefined);
      const targetAgency = agencies.find((a) => a.id === agencyId);
      if (targetAgency?.ownerUid && (updates.subscriptionPlan || updates.verified)) {
        void createNotificationInFirestore({
          recipientUid: targetAgency.ownerUid,
          type: 'PLAN_APPROVED',
          title: updates.subscriptionPlan
            ? `Plano ${updates.subscriptionPlan} ativado!`
            : `Selo de verificação aprovado!`,
          body: updates.subscriptionPlan
            ? `Sua assinatura ${updates.subscriptionPlan} foi aprovada pela equipe SouNativo.`
            : `Sua operadora "${targetAgency.name}" recebeu o selo oficial de verificação.`,
          link: '/dashboard?mode=partner',
        });
      }
      const { requestedPlan: updRequestedPlan, ...restUpdates } = updates;
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === agencyId
            ? {
                ...a,
                ...restUpdates,
                ...(updRequestedPlan !== undefined
                  ? { requestedPlan: updRequestedPlan ?? undefined }
                  : {}),
                ...(nextSubStatus ? { subscriptionStatus: nextSubStatus } : {}),
              }
            : a
        )
      );
      showToast('Parceiro atualizado pelo Admin!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar agência.', 'error');
    }
  };

  const handleTripControl = async (
    tripId: string,
    updates: { featured?: boolean; isActive?: boolean }
  ) => {
    try {
      await updateTripAdminControls(tripId, updates);
      setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, ...updates } : t)));
      showToast('Pacote atualizado pelo Admin!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar pacote.', 'error');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTripAsAdmin(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      showToast('Pacote removido pelo Admin.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover pacote.', 'error');
    }
  };

  const handleBookingStatusChange = async (
    bookingId: string,
    status: BookingStatus,
    cancellationReason?: string
  ) => {
    try {
      await updateBookingStatusInFirestore(bookingId, status, cancellationReason);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status,
                ...(cancellationReason ? { cancellationReason } : {}),
              }
            : b
        )
      );
      showToast(
        status === 'CONFIRMED' ? 'Reserva confirmada pelo Admin!' : 'Reserva cancelada pelo Admin.',
        status === 'CONFIRMED' ? 'success' : 'info'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar reserva.', 'error');
    }
  };

  const handleContactStatusChange = async (messageId: string, status: ContactMessageStatus) => {
    try {
      await updateContactMessageStatusAsAdmin(messageId, status);
      setContactMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status } : m)));
      showToast('Status da mensagem atualizado.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar mensagem.', 'error');
    }
  };

  const handleDeleteContactMessage = async (messageId: string) => {
    try {
      await deleteContactMessageAsAdmin(messageId);
      setContactMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast('Mensagem excluída.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao excluir mensagem.', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReviewAsAdmin(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast('Avaliação removida pela moderação.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao remover avaliação.', 'error');
    }
  };

  const handleDeleteErrorLog = async (logId: string) => {
    try {
      await deleteErrorLogAsAdmin(logId);
      setErrorLogs((prev) => prev.filter((e) => e.id !== logId));
      showToast('Registro de telemetria limpo.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao limpar log.', 'error');
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando console administrativo...</p>;
  }

  const normalized = search.trim().toLowerCase();
  const visibleUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!normalized) return true;
    return (
      (u.name ?? '').toLowerCase().includes(normalized) ||
      (u.email ?? '').toLowerCase().includes(normalized)
    );
  });

  const pendingUpgradeAgencies = agencies.filter((a) => a.subscriptionStatus === 'PENDING');

  const navItems: Array<{
    id: AdminTab;
    label: string;
    badge?: number;
    highlight?: boolean;
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
  }> = [
    { id: 'overview', label: 'Visão Geral & Métricas', icon: BarChart3 },
    { id: 'users', label: 'Usuários & Papéis', badge: users.length, icon: Users },
    {
      id: 'agencies',
      label: 'Agências & Guias',
      badge: metrics.pendingUpgrades > 0 ? metrics.pendingUpgrades : agencies.length,
      highlight: metrics.pendingUpgrades > 0,
      icon: Briefcase,
    },
    { id: 'trips', label: 'Pacotes & Experiências', badge: trips.length, icon: Plane },
    {
      id: 'operations',
      label: 'Reservas, Leads & Logs',
      badge: metrics.pendingBookings + metrics.newLeads + errorLogs.length,
      highlight: metrics.pendingBookings + metrics.newLeads > 0,
      icon: Inbox,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Left Lateral Sidebar Menu (sticky on desktop/tablet) */}
      <aside className="md:col-span-4 lg:col-span-3 md:sticky md:top-20 space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <div className="bg-gradient-to-br from-stone-900 via-primary-950 to-primary-900 p-5 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                <ShieldCheck size={22} />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Online
              </span>
            </div>
            <h2 className="font-serif text-lg font-bold">Console Admin Master</h2>
            <p className="text-xs text-stone-300">
              Governança de usuários, agências, guias, roteiros, reservas e LGPD.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-stone-200/70 border-t border-stone-200/70">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className="bg-white py-3 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-base font-bold text-stone-900">{users.length}</p>
              <p className="text-[10px] font-semibold uppercase text-stone-500">Contas</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agencies')}
              className="bg-white py-3 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-base font-bold text-stone-900">{agencies.length}</p>
              <p className="text-[10px] font-semibold uppercase text-stone-500">Parceiros</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trips')}
              className="bg-white py-3 text-center hover:bg-primary-50/50 transition-colors"
            >
              <p className="font-serif text-base font-bold text-stone-900">{trips.length}</p>
              <p className="text-[10px] font-semibold uppercase text-stone-500">Roteiros</p>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card">
          <nav aria-label="Menu do Console Administrativo">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors relative ${
                    idx < navItems.length - 1 ? 'border-b border-stone-100' : ''
                  } ${
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
                        item.highlight
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
          </nav>
        </div>

        <Button
          size="sm"
          variant="outline"
          fullWidth
          leftIcon={<RefreshCw size={14} />}
          onClick={() => void loadAdminConsole()}
        >
          Atualizar Dados do Console
        </Button>
      </aside>

      {/* Right Content Area */}
      <div className="md:col-span-8 lg:col-span-9 space-y-6">
        {loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-xs text-red-900">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => void loadAdminConsole()}
            >
              Recarregar console
            </Button>
          </div>
        )}

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>GMV Confirmado</span>
              <CalendarCheck size={16} className="text-emerald-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-stone-900">
              {formatCurrencyBRL(metrics.confirmedRevenue)}
            </p>
            <p className="text-xs text-stone-500">
              {bookings.length} reservas ({metrics.pendingBookings} pendentes)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agencies')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>Agências &amp; Guias</span>
              <Briefcase size={16} className="text-primary-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-stone-900">
              {metrics.agenciesOnlyCount} ag. · {metrics.guidesCount} guias
            </p>
            <p className="text-xs text-stone-500">
              {metrics.pendingUpgrades > 0
                ? `${metrics.pendingUpgrades} upgrade(s) aguardando aprovação`
                : `MRR est. ${formatCurrencyBRL(metrics.estimatedMrr)}/mês`}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trips')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>Catálogo &amp; Contas</span>
              <Compass size={16} className="text-secondary-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-stone-900">
              {metrics.activeTrips} roteiros
            </p>
            <p className="text-xs text-stone-500">
              {users.length} contas ({metrics.suspendedUsers} suspensas)
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className="text-left rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1 hover:border-primary-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>Leads &amp; Telemetria</span>
              <Inbox size={16} className="text-amber-600" />
            </div>
            <p className="font-serif text-2xl font-bold text-stone-900">
              {metrics.newLeads} lead(s)
            </p>
            <p className="text-xs text-stone-500">
              {reviews.length} avaliações · {errorLogs.length} log(s)
            </p>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Pending Plan Upgrades Queue */}
            {pendingUpgradeAgencies.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-amber-950 flex items-center gap-2">
                    <Clock size={18} className="text-amber-600" /> Solicitações de Upgrade de Plano
                    ({pendingUpgradeAgencies.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('agencies')}
                    className="text-xs font-bold text-amber-900 hover:underline"
                  >
                    Ver todos os parceiros
                  </button>
                </div>

                <div className="space-y-2">
                  {pendingUpgradeAgencies.map((ag) => {
                    const targetPlan = ag.requestedPlan ?? ag.subscriptionPlan;
                    return (
                      <div
                        key={ag.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white p-3.5"
                      >
                        <div>
                          <p className="text-sm font-bold text-stone-900">
                            {ag.name}{' '}
                            <span className="text-xs font-normal text-stone-500">
                              ({ag.isGuide ? 'Guia de Turismo' : 'Agência'})
                            </span>
                          </p>
                          <p className="text-xs text-stone-600">
                            Plano atual: {ag.subscriptionPlan} &rarr; Solicitou:{' '}
                            <strong>{targetPlan}</strong>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void handleAgencyControl(ag.id, {
                              subscriptionPlan: targetPlan,
                              requestedPlan: null,
                              subscriptionStatus: 'ACTIVE',
                            })
                          }
                        >
                          Aprovar {targetPlan}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Platform Overview Grid: Latest Bookings + Latest Partners */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-600" /> Últimas Reservas Globais
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('operations')}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Ver todas ({bookings.length})
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <p className="text-xs text-stone-500">Nenhuma reserva registrada.</p>
                ) : (
                  <div className="space-y-2.5">
                    {bookings.slice(0, 5).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
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
                          <p className="text-xs font-bold text-stone-900 truncate mt-0.5">
                            {b.tripTitle}
                          </p>
                          <p className="text-[11px] text-stone-500 truncate">
                            {b.clientName} · {b.agencyName}
                          </p>
                        </div>
                        <span className="font-serif text-sm font-bold text-primary-700 shrink-0">
                          {formatCurrencyBRL(b.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Briefcase size={18} className="text-primary-600" /> Agências &amp; Guias
                    Recentes
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('agencies')}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Gerenciar ({agencies.length})
                  </button>
                </div>

                {agencies.length === 0 ? (
                  <p className="text-xs text-stone-500">Nenhum parceiro cadastrado.</p>
                ) : (
                  <div className="space-y-2.5">
                    {agencies.slice(0, 5).map((ag) => (
                      <div
                        key={ag.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge tone={ag.isGuide ? 'secondary' : 'primary'}>
                              {ag.isGuide ? 'Guia de Turismo' : 'Agência'}
                            </Badge>
                            <Badge tone={ag.verified ? 'success' : 'neutral'}>
                              {ag.verified ? 'Verificado' : 'Pendente selo'}
                            </Badge>
                          </div>
                          <Link
                            to={`/${ag.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-stone-900 hover:text-primary-600 mt-1"
                          >
                            {ag.name} (/{ag.slug}) <ExternalLink size={11} />
                          </Link>
                        </div>
                        <Button
                          size="sm"
                          variant={ag.verified ? 'outline' : 'primary'}
                          onClick={() =>
                            void handleAgencyControl(ag.id, { verified: !ag.verified })
                          }
                        >
                          {ag.verified ? 'Verificado' : 'Verificar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: USERS */}
        {activeTab === 'users' && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary-600" />
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  Usuários, Papéis &amp; Acesso ({visibleUsers.length}/{users.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por nome ou e-mail..."
                  className="min-h-[40px] w-full sm:w-56 rounded-xl border border-stone-300 px-3 text-sm"
                />
                <select
                  aria-label="Filtrar usuários por papel"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
                  className="min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold"
                >
                  <option value="ALL">Todos os papéis</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {visibleUsers.length === 0 ? (
              <p className="text-sm text-stone-500">Nenhum usuário encontrado com este filtro.</p>
            ) : (
              <div className="space-y-2.5">
                {visibleUsers.map((account) => {
                  const isSuspended = account.status === 'SUSPENDED';
                  return (
                    <div
                      key={account.uid}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-stone-200 p-3.5"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-stone-900">
                            {account.name || 'Sem nome'}
                          </p>
                          <Badge tone="primary">{formatUserRoleLabel(account.role)}</Badge>
                          <Badge tone={isSuspended ? 'warning' : 'success'}>
                            {isSuspended ? 'Suspenso' : 'Ativo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-stone-500">
                          {account.email || 'sem e-mail'} · UID: {(account.uid ?? '').slice(0, 8)}
                          ...
                          {account.createdAt
                            ? ` · Cadastro ${formatShortDate(account.createdAt)}`
                            : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Papel de ${account.name || account.uid}`}
                          disabled={busyUserUid === account.uid}
                          value={account.role}
                          onChange={(e) =>
                            void handleRoleChange(account.uid, e.target.value as UserRole)
                          }
                          className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold text-stone-800 disabled:opacity-60"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <Button
                          size="sm"
                          variant={isSuspended ? 'outline' : 'ghost'}
                          disabled={busyUserUid === account.uid}
                          leftIcon={
                            isSuspended ? (
                              <ShieldCheck size={14} className="text-emerald-600" />
                            ) : (
                              <ShieldBan size={14} className="text-red-600" />
                            )
                          }
                          onClick={() =>
                            void handleRoleChange(
                              account.uid,
                              account.role,
                              isSuspended ? 'ACTIVE' : 'SUSPENDED'
                            )
                          }
                        >
                          {isSuspended ? 'Reativar' : 'Suspender'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: AGENCIES & GUIDES */}
        {activeTab === 'agencies' && (
          <AdminCatalogSection
            agencies={agencies}
            trips={trips}
            sectionMode="agencies"
            onAgencyControl={handleAgencyControl}
            onTripControl={handleTripControl}
            onDeleteTrip={handleDeleteTrip}
          />
        )}

        {/* TAB 4: TRIPS & EXPERIENCES */}
        {activeTab === 'trips' && (
          <AdminCatalogSection
            agencies={agencies}
            trips={trips}
            sectionMode="trips"
            onAgencyControl={handleAgencyControl}
            onTripControl={handleTripControl}
            onDeleteTrip={handleDeleteTrip}
          />
        )}

        {/* TAB 5: OPERATIONS (BOOKINGS, LEADS, REVIEWS, TELEMETRY) */}
        {activeTab === 'operations' && (
          <AdminOperationsSection
            bookings={bookings}
            contactMessages={contactMessages}
            reviews={reviews}
            errorLogs={errorLogs}
            onBookingStatusChange={handleBookingStatusChange}
            onContactStatusChange={handleContactStatusChange}
            onDeleteContactMessage={handleDeleteContactMessage}
            onDeleteReview={handleDeleteReview}
            onDeleteErrorLog={handleDeleteErrorLog}
          />
        )}
      </div>
    </div>
  );
};
