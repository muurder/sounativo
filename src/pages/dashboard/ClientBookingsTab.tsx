import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, ExternalLink, RefreshCw, Star, Ticket } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrencyBRL, formatPaymentMethod, formatShortDate } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { BookingVoucherModal } from './BookingVoucherModal';

interface ClientBookingsTabProps {
  bookings: Booking[];
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
  PENDING: { label: 'Aguardando agência', tone: 'secondary' },
};

export const ClientBookingsTab: React.FC<ClientBookingsTabProps> = ({
  bookings,
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

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando reservas...</p>;
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

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  if (safeBookings.length === 0) {
    return (
      <EmptyState
        title="Nenhuma reserva ainda"
        description="Quando você solicitar uma reserva em qualquer pacote do SouNativo, ela aparecerá aqui com seu código de voucher."
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

  return (
    <div className="space-y-4">
      {safeBookings.map((booking) => {
        const badgeInfo = STATUS_BADGE_MAP[booking.status] ?? STATUS_BADGE_MAP.PENDING;
        const targetSlug = booking.tripSlug || booking.tripId;
        return (
          <div
            key={booking.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={badgeInfo.tone}>{badgeInfo.label}</Badge>
                  <span className="text-xs font-mono text-stone-500">{booking.voucherCode}</span>
                  <span className="text-xs text-stone-400">
                    · {formatPaymentMethod(booking.paymentMethod)}
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

                <p className="text-xs text-stone-600">
                  {booking.agencyName} · {booking.adults ?? 1} adulto(s)
                  {(booking.children ?? 0) > 0 ? `, ${booking.children} criança(s)` : ''} ·{' '}
                  <strong>{formatCurrencyBRL(booking.totalPrice)}</strong>
                </p>

                {booking.departureDate && (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                    <CalendarDays size={13} /> Saída: {formatShortDate(booking.departureDate)}
                  </p>
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

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Ticket size={14} />}
                  onClick={() => setSelectedVoucher(booking)}
                >
                  Voucher
                </Button>
                {booking.status === 'CONFIRMED' && (
                  <Link
                    to={`/viagem/${targetSlug}`}
                    className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    Avaliar viagem
                  </Link>
                )}
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
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {confirmCancelId === booking.id && (
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-stone-100">
                <input
                  type="text"
                  maxLength={500}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Motivo do cancelamento (opcional)..."
                  className="flex-1 min-h-[38px] rounded-xl border border-stone-300 px-3 text-xs"
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
      })}

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
