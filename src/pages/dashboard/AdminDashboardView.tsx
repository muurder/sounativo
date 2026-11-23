import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CalendarCheck,
  Compass,
  Inbox,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
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
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { AdminCatalogSection } from './AdminCatalogSection';
import { AdminOperationsSection } from './AdminOperationsSection';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'CLIENT', label: 'Viajante / Cliente' },
  { value: 'AGENCY', label: 'Agência de Turismo' },
  { value: 'GUIDE', label: 'Guia / Agente de Turismo' },
  { value: 'ADMIN', label: 'Administrador Master' },
];

type AdminTab = 'users' | 'catalog' | 'operations';

export const AdminDashboardView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
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

    return {
      confirmedRevenue,
      pendingBookings,
      pendingUpgrades,
      newLeads,
      activeTrips,
      suspendedUsers,
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
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === agencyId
            ? {
                ...a,
                ...updates,
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

  return (
    <div className="space-y-6">
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
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
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
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Parceiros &amp; Planos</span>
            <Briefcase size={16} className="text-primary-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">{agencies.length}</p>
          <p className="text-xs text-stone-500">
            {metrics.pendingUpgrades > 0
              ? `${metrics.pendingUpgrades} upgrade(s) aguardando aprovação`
              : `${agencies.filter((a) => a.verified).length} verificados`}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Catálogo &amp; Usuários</span>
            <Compass size={16} className="text-secondary-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">
            {metrics.activeTrips} roteiros
          </p>
          <p className="text-xs text-stone-500">
            {users.length} contas ({metrics.suspendedUsers} suspensas)
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>Leads &amp; Moderação</span>
            <Inbox size={16} className="text-amber-600" />
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900">{metrics.newLeads} novo(s)</p>
          <p className="text-xs text-stone-500">
            {contactMessages.length} mensagens · {reviews.length} avaliações
          </p>
        </div>
      </div>

      {/* Console Sub-Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
        {[
          { id: 'users' as const, label: `Usuários & Papéis (${users.length})` },
          {
            id: 'catalog' as const,
            label: `Parceiros & Roteiros (${agencies.length}/${trips.length})${
              metrics.pendingUpgrades > 0 ? ` · ${metrics.pendingUpgrades} upgrade` : ''
            }`,
          },
          {
            id: 'operations' as const,
            label: `Reservas, Leads & Reviews (${bookings.length + contactMessages.length})`,
          },
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
                        <Badge tone={isSuspended ? 'warning' : 'success'}>
                          {isSuspended ? 'Suspenso' : 'Ativo'}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500">
                        {account.email || 'sem e-mail'} · UID: {(account.uid ?? '').slice(0, 8)}...
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

      {activeTab === 'catalog' && (
        <AdminCatalogSection
          agencies={agencies}
          trips={trips}
          onAgencyControl={handleAgencyControl}
          onTripControl={handleTripControl}
          onDeleteTrip={handleDeleteTrip}
        />
      )}

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
  );
};
