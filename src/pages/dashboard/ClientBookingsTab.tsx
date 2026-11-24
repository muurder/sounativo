import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpDown,
  CalendarDays,
  Clock,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  RefreshCw,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import { Agency, Booking, BookingStatus, Trip } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatCurrencyBRL, formatPaymentMethod, formatShortDate } from '@/utils/formatters';
import { buildAgencyWhatsAppLink } from '@/utils/whatsapp';
import { useToast } from '@/context/ToastContext';
import { BookingVoucherModal } from './BookingVoucherModal';

interface ClientBookingsTabProps {
  bookings: Booking[];
  trips?: Trip[];
  agencies?: Agency[];
  loading: boolean;
  error?: string | null;
  onReload?: () => Promise<void>;
  onUpdateStatus: (
    bookingId: string,
    status: BookingStatus,
    cancellationReason?: string
  ) => Promise<void>;
}

const STATUS_BADGE_MAP: Record<
  BookingStatus,
  { label: string; tone: 'success' | 'warning' | 'secondary' }
> = {
  CONFIRMED: { label: 'Confirmada', tone: 'success' },
  CANCELLED: { label: 'Cancelada', tone: 'warning' },
  PENDING: { label: 'Aguardando confirmação', tone: 'secondary' },
};

function computeDaysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.ceil((parsed.getTime() - today.getTime()) / 86_400_000);
}

export const ClientBookingsTab: React.FC<ClientBookingsTabProps> = ({
  bookings,
  trips = [],
  agencies = [],
  loading,
  error,
  onReload,
  onUpdateStatus,
}) => {
  const { showToast } = useToast();
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'alphabetical'>('date');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  const tripById = useMemo(() => {
    const map = new Map<string, Trip>();
    for (const t of trips) {
      if (t?.id) map.set(t.id, t);
    }
    return map;
  }, [trips]);

  const agencyById = useMemo(() => {
    const map = new Map<string, Agency>();
    for (const a of agencies) {
      if (a?.id) map.set(a.id, a);
    }
    return map;
  }, [agencies]);

  const safeBookings = useMemo(() => (Array.isArray(bookings) ? bookings : []), [bookings]);

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const b of safeBookings) {
      const matchedTrip = tripById.get(b.tripId);
      const effectiveDate = b.departureDate || matchedTrip?.startDate || b.createdAt;
      const daysUntil = computeDaysUntil(effectiveDate);

      if (b.status !== 'CANCELLED' && (daysUntil === null || daysUntil >= 0)) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }

    const compare = (a: Booking, b: Booking, asc: boolean) => {
      if (sortBy === 'alphabetical') {
        const titleA = a.tripTitle || tripById.get(a.tripId)?.title || '';
        const titleB = b.tripTitle || tripById.get(b.tripId)?.title || '';
        return asc
          ? titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' })
          : titleB.localeCompare(titleA, 'pt-BR', { sensitivity: 'base' });
      }
      const dateA = a.departureDate || tripById.get(a.tripId)?.startDate || a.createdAt || '';
      const dateB = b.departureDate || tripById.get(b.tripId)?.startDate || b.createdAt || '';
      const tA = dateA ? new Date(dateA).getTime() : 0;
      const tB = dateB ? new Date(dateB).getTime() : 0;
      return asc ? tA - tB : tB - tA;
    };

    upcoming.sort((a, b) => compare(a, b, true));
    past.sort((a, b) => compare(a, b, false));

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [safeBookings, sortBy, tripById]);

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando suas viagens e reservas...</p>;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50/70 p-5 space-y-3 max-w-xl"
      >
        <div className="flex items-start gap-2.5 text-xs text-red-900">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        {onReload && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void onReload()}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (safeBookings.length === 0) {
    return (
      <EmptyState
        title="Nenhuma reserva ainda"
        description="Quando você solicitar uma reserva em qualquer pacote ou experiência do SouNativo, ela aparecerá aqui com seu código de voucher e lista de passageiros."
      />
    );
  }

  const handleConfirmCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await onUpdateStatus(
        bookingId,
        'CANCELLED',
        cancelReason.trim() || 'Cancelada pelo viajante'
      );
      setConfirmCancelId(null);
      setCancelReason('');
      showToast('Reserva cancelada.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao cancelar reserva.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const renderBookingItem = (booking: Booking) => {
    const badgeInfo = STATUS_BADGE_MAP[booking.status] ?? STATUS_BADGE_MAP.PENDING;
    const matchedTrip = tripById.get(booking.tripId);
    const matchedAgency = agencyById.get(booking.agencyId);
    const targetSlug = booking.tripSlug || matchedTrip?.slug || booking.tripId;
    const coverImg =
      booking.tripImage ||
      matchedTrip?.images?.[0] ||
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80';
    const effectiveDate = booking.departureDate || matchedTrip?.startDate;
    const daysUntil = computeDaysUntil(effectiveDate);
    const totalPax = (booking.adults ?? 1) + (booking.children ?? 0);
    const paxList = Array.isArray(booking.passengerDetails) ? booking.passengerDetails : [];
    const whatsappPhone = matchedAgency?.whatsapp || matchedAgency?.phone;
    const whatsappUrl = whatsappPhone
      ? buildAgencyWhatsAppLink(
          whatsappPhone,
          `Olá! Tenho uma dúvida sobre minha reserva ${booking.voucherCode} para "${booking.tripTitle}".`
        )
      : null;

    return (
      <div
        key={booking.id}
        className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card hover:border-stone-300 transition-all"
      >
        <div
          className={`flex flex-col ${
            viewMode === 'card' ? 'md:flex-row' : 'sm:flex-row'
          } gap-4 p-4 sm:p-5`}
        >
          {/* Cover Thumbnail */}
          <Link
            to={`/viagem/${targetSlug}`}
            className={`relative overflow-hidden rounded-xl bg-stone-100 shrink-0 group ${
              viewMode === 'card' ? 'h-44 md:h-auto md:w-52' : 'h-28 sm:w-36'
            }`}
          >
            <SafeImage
              src={coverImg}
              alt={booking.tripTitle}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {booking.status !== 'CANCELLED' && daysUntil !== null && daysUntil >= 0 && (
              <span className="absolute bottom-2 left-2 rounded-lg bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white">
                {daysUntil === 0
                  ? 'Embarque hoje!'
                  : daysUntil === 1
                    ? 'Falta 1 dia'
                    : `Faltam ${daysUntil} dias`}
              </span>
            )}
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={badgeInfo.tone}>{badgeInfo.label}</Badge>
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-mono font-semibold text-stone-700">
                    {booking.voucherCode}
                  </span>
                  <span className="text-xs text-stone-400">
                    · {formatPaymentMethod(booking.paymentMethod)}
                  </span>
                </div>
                <span className="font-serif text-lg font-bold text-primary-700">
                  {formatCurrencyBRL(booking.totalPrice)}
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-stone-900">
                <Link
                  to={`/viagem/${targetSlug}`}
                  className="inline-flex items-center gap-1.5 hover:text-primary-600"
                >
                  {booking.tripTitle}
                  <ExternalLink size={14} />
                </Link>
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                {matchedTrip?.destination && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} className="text-primary-600" />
                    {matchedTrip.destination}
                  </span>
                )}
                {matchedAgency?.slug ? (
                  <Link
                    to={`/${matchedAgency.slug}`}
                    className="font-semibold text-primary-600 hover:underline"
                  >
                    Organizado por {booking.agencyName}
                  </Link>
                ) : (
                  <span>Organizado por {booking.agencyName}</span>
                )}
              </div>

              {/* Date, Duration & Passengers Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">
                  <CalendarDays size={14} className="text-primary-600 shrink-0" />
                  <span>
                    {effectiveDate ? formatShortDate(effectiveDate) : 'Data a combinar'}
                  </span>
                </div>
                {matchedTrip?.durationDays && (
                  <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">
                    <Clock size={14} className="text-primary-600 shrink-0" />
                    <span>{matchedTrip.durationDays} dia(s)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">
                  <Users size={14} className="text-primary-600 shrink-0" />
                  <span>
                    {totalPax > 1
                      ? `Você e +${totalPax - 1} passageiro(s)`
                      : `${booking.adults ?? 1} adulto(s)`}
                  </span>
                </div>
              </div>

              {paxList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {paxList.slice(0, 4).map((pax, idx) => (
                    <span
                      key={`${pax.name}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-100 px-2.5 py-0.5 text-[11px] font-medium text-primary-800"
                    >
                      {pax.name}
                    </span>
                  ))}
                  {paxList.length > 4 && (
                    <span className="text-[11px] text-stone-500">+{paxList.length - 4}</span>
                  )}
                </div>
              )}

              {booking.notes && (
                <p className="text-xs text-stone-500 italic">Obs.: {booking.notes}</p>
              )}
              {booking.status === 'CANCELLED' && booking.cancellationReason && (
                <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 inline-block">
                  Motivo do cancelamento: {booking.cancellationReason}
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Ticket size={14} />}
                  onClick={() => setSelectedVoucher(booking)}
                >
                  Ver Voucher &amp; Passageiros
                </Button>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageCircle size={13} />
                    WhatsApp da Agência
                  </a>
                )}

                {booking.status === 'CONFIRMED' && (
                  <Link
                    to={`/viagem/${targetSlug}`}
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    Avaliar Viagem
                  </Link>
                )}
              </div>

              {booking.status !== 'CANCELLED' && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancellingId === booking.id}
                  onClick={() => {
                    setConfirmCancelId(confirmCancelId === booking.id ? null : booking.id);
                    setCancelReason('');
                  }}
                >
                  Cancelar reserva
                </Button>
              )}
            </div>
          </div>
        </div>

        {confirmCancelId === booking.id && (
          <div className="flex flex-col sm:flex-row gap-2 px-5 pb-4 pt-3 border-t border-stone-100 bg-stone-50/70">
            <input
              type="text"
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento (opcional)..."
              className="flex-1 min-h-[38px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={cancellingId === booking.id}
                onClick={() => {
                  setConfirmCancelId(null);
                  setCancelReason('');
                }}
              >
                Manter reserva
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={cancellingId === booking.id}
                onClick={() => void handleConfirmCancel(booking.id)}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls: Filter, Sort, and View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL' as const, label: `Todas (${safeBookings.length})` },
            { id: 'UPCOMING' as const, label: `Próximas (${upcomingBookings.length})` },
            { id: 'PAST' as const, label: `Histórico / Canceladas (${pastBookings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionFilter(tab.id)}
              className={`min-h-[34px] rounded-xl px-3 text-xs font-semibold transition-colors ${
                sectionFilter === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
            <button
              type="button"
              onClick={() => setSortBy('date')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                sortBy === 'date' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-600'
              }`}
            >
              <ArrowUpDown size={13} /> Data
            </button>
            <button
              type="button"
              onClick={() => setSortBy('alphabetical')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-stone-600'
              }`}
            >
              <ArrowDownAZ size={13} /> A-Z
            </button>
          </div>

          <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1">
            <button
              type="button"
              aria-label="Visualização em cards"
              onClick={() => setViewMode('card')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'card' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              aria-label="Visualização compacta"
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-stone-500'
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Trips Section */}
      {(sectionFilter === 'ALL' || sectionFilter === 'UPCOMING') && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Próximas Viagens ({upcomingBookings.length})
          </h3>
          {upcomingBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-xs text-stone-500">
              Você não possui embarques futuros agendados no momento.{' '}
              <Link to="/trips" className="font-bold text-primary-600 hover:underline">
                Explorar próximos roteiros
              </Link>
            </div>
          ) : (
            <div className="space-y-4">{upcomingBookings.map(renderBookingItem)}</div>
          )}
        </div>
      )}

      {/* Past / Cancelled Section */}
      {(sectionFilter === 'ALL' || sectionFilter === 'PAST') && pastBookings.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Histórico &amp; Canceladas ({pastBookings.length})
          </h3>
          <div className="space-y-4">{pastBookings.map(renderBookingItem)}</div>
        </div>
      )}

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
