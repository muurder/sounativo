import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Mail,
  MessageSquareWarning,
  Search,
  Star,
  Ticket,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ContactMessageRecord, ContactMessageStatus } from '@/services/contactService';
import { Booking, BookingStatus, TripReview } from '@/types';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookingVoucherModal } from './BookingVoucherModal';

interface AdminOperationsSectionProps {
  bookings: Booking[];
  contactMessages: ContactMessageRecord[];
  reviews: TripReview[];
  onBookingStatusChange: (
    bookingId: string,
    status: BookingStatus,
    cancellationReason?: string
  ) => Promise<void>;
  onContactStatusChange: (messageId: string, status: ContactMessageStatus) => Promise<void>;
  onDeleteContactMessage: (messageId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
}

const BOOKING_STATUS_OPTIONS: Array<{ value: 'ALL' | BookingStatus; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

const CONTACT_STATUS_OPTIONS: Array<{ value: ContactMessageStatus; label: string }> = [
  { value: 'NEW', label: 'Nova' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'RESOLVED', label: 'Resolvida' },
  { value: 'ARCHIVED', label: 'Arquivada' },
];

export const AdminOperationsSection: React.FC<AdminOperationsSectionProps> = ({
  bookings,
  contactMessages,
  reviews,
  onBookingStatusChange,
  onContactStatusChange,
  onDeleteContactMessage,
  onDeleteReview,
}) => {
  const [bookingFilter, setBookingFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const [leadFilter, setLeadFilter] = useState<'ALL' | ContactMessageStatus>('ALL');
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);
  const [busyReviewId, setBusyReviewId] = useState<string | null>(null);

  const safeBookings = useMemo(() => (Array.isArray(bookings) ? bookings : []), [bookings]);
  const safeLeads = useMemo(
    () => (Array.isArray(contactMessages) ? contactMessages : []),
    [contactMessages]
  );
  const safeReviews = useMemo(() => (Array.isArray(reviews) ? reviews : []), [reviews]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return safeBookings.filter((b) => {
      if (bookingFilter !== 'ALL' && b.status !== bookingFilter) return false;
      if (!q) return true;
      return (
        (b.tripTitle ?? '').toLowerCase().includes(q) ||
        (b.clientName ?? '').toLowerCase().includes(q) ||
        (b.clientEmail ?? '').toLowerCase().includes(q) ||
        (b.agencyName ?? '').toLowerCase().includes(q) ||
        (b.voucherCode ?? '').toLowerCase().includes(q)
      );
    });
  }, [bookingFilter, bookingSearch, safeBookings]);

  const filteredLeads = useMemo(() => {
    if (leadFilter === 'ALL') return safeLeads;
    return safeLeads.filter((m) => m.status === leadFilter);
  }, [leadFilter, safeLeads]);

  const handleBookingAction = async (bookingId: string, status: BookingStatus, reason?: string) => {
    setBusyBookingId(bookingId);
    try {
      await onBookingStatusChange(bookingId, status, reason);
      setCancellingId(null);
      setCancelReason('');
    } finally {
      setBusyBookingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Global Bookings */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Reservas Globais ({safeBookings.length})
            </h2>
            <p className="text-xs text-stone-500">
              Supervisão de vouchers, aprovações e cancelamentos em todo o marketplace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Voucher, cliente, agência..."
                className="min-h-[38px] w-full sm:w-56 rounded-xl border border-stone-300 pl-8 pr-3 text-xs"
              />
            </div>
            <select
              aria-label="Filtrar reservas globais por status"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value as 'ALL' | BookingStatus)}
              className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
            >
              {BOOKING_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nenhuma reserva encontrada para os filtros atuais.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-stone-200 p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
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
                        {b.status}
                      </Badge>
                      <span className="text-xs font-mono text-stone-500">{b.voucherCode}</span>
                      <span className="text-xs text-stone-400">· {b.agencyName}</span>
                    </div>
                    <p className="text-sm font-semibold text-stone-900">{b.tripTitle}</p>
                    <p className="text-xs text-stone-600">
                      {b.clientName} ({b.clientEmail || 'sem e-mail'}) · {b.adults ?? 1} ad.
                      {(b.children ?? 0) > 0 ? `, ${b.children} cri.` : ''} ·{' '}
                      <strong>{formatCurrencyBRL(b.totalPrice)}</strong> · {b.paymentMethod}
                    </p>
                    {b.cancellationReason && (
                      <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 inline-block">
                        Motivo do cancelamento: {b.cancellationReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Ticket size={14} />}
                      onClick={() => setSelectedVoucher(b)}
                    >
                      Voucher
                    </Button>
                    {b.status === 'PENDING' && (
                      <Button
                        size="sm"
                        loading={busyBookingId === b.id}
                        leftIcon={<CheckCircle2 size={14} />}
                        onClick={() => void handleBookingAction(b.id, 'CONFIRMED')}
                      >
                        Confirmar
                      </Button>
                    )}
                    {b.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyBookingId === b.id}
                        leftIcon={<XCircle size={14} className="text-red-600" />}
                        onClick={() => {
                          setCancellingId(cancellingId === b.id ? null : b.id);
                          setCancelReason('');
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {cancellingId === b.id && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-100">
                    <input
                      type="text"
                      maxLength={500}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo do cancelamento (opcional)..."
                      className="flex-1 min-h-[38px] rounded-xl border border-stone-300 px-3 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busyBookingId === b.id}
                      onClick={() => void handleBookingAction(b.id, 'CANCELLED', cancelReason)}
                    >
                      Confirmar Cancelamento
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact & Group Quote Leads Inbox */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Inbox de Leads &amp; Atendimento ({safeLeads.length})
            </h2>
            <p className="text-xs text-stone-500">
              Mensagens institucionais e cotações de grupos fechados recebidas pela plataforma.
            </p>
          </div>
          <select
            aria-label="Filtrar mensagens de contato por status"
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value as 'ALL' | ContactMessageStatus)}
            className="min-h-[38px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
          >
            <option value="ALL">Todos os status</option>
            {CONTACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {filteredLeads.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma mensagem registrada com este filtro.</p>
        ) : (
          <div className="space-y-3">
            {filteredLeads.map((msg) => (
              <div
                key={msg.id}
                className="rounded-xl border border-stone-200 p-4 flex flex-col md:flex-row md:items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={msg.source === 'GROUP_QUOTE' ? 'secondary' : 'neutral'}>
                      {msg.source === 'GROUP_QUOTE' ? 'Cotação de Grupo' : 'Contato Geral'}
                    </Badge>
                    <Badge
                      tone={
                        msg.status === 'RESOLVED'
                          ? 'success'
                          : msg.status === 'NEW'
                            ? 'warning'
                            : 'primary'
                      }
                    >
                      {CONTACT_STATUS_OPTIONS.find((o) => o.value === msg.status)?.label ??
                        msg.status}
                    </Badge>
                    <span className="text-xs text-stone-400">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    {msg.name} · <span className="font-normal text-stone-600">{msg.email}</span>
                  </p>
                  <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                    {msg.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label={`Status de mensagem de ${msg.name}`}
                    disabled={busyLeadId === msg.id}
                    value={msg.status}
                    onChange={(e) => {
                      const next = e.target.value as ContactMessageStatus;
                      setBusyLeadId(msg.id);
                      void onContactStatusChange(msg.id, next).finally(() => setBusyLeadId(null));
                    }}
                    className="min-h-[36px] rounded-xl border border-stone-300 bg-white px-2.5 text-xs font-semibold"
                  >
                    {CONTACT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <a
                    href={`mailto:${msg.email}?subject=${encodeURIComponent('Retorno SouNativo Atendimento')}`}
                    className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-primary-700 hover:bg-stone-50"
                  >
                    <Mail size={13} /> Responder
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Excluir mensagem de ${msg.name}`}
                    disabled={busyLeadId === msg.id}
                    onClick={() => {
                      setBusyLeadId(msg.id);
                      void onDeleteContactMessage(msg.id).finally(() => setBusyLeadId(null));
                    }}
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews Moderation */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareWarning size={20} className="text-secondary-600" />
          <h2 className="font-serif text-xl font-bold text-stone-900">
            Moderação de Avaliações ({safeReviews.length})
          </h2>
        </div>

        {safeReviews.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma avaliação registrada no Firestore ainda.</p>
        ) : (
          <div className="space-y-3">
            {safeReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">{rev.userName}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {rev.rating}.0
                    </span>
                    <span className="text-xs text-stone-400">
                      Pacote: {(rev.tripId ?? '').slice(0, 10)}...
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{rev.comment}</p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyReviewId === rev.id}
                  onClick={() => {
                    setBusyReviewId(rev.id);
                    void onDeleteReview(rev.id).finally(() => setBusyReviewId(null));
                  }}
                >
                  <Trash2 size={14} className="text-red-600 mr-1" /> Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
