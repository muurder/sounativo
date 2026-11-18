import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ExternalLink, RefreshCw, Ticket } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrencyBRL } from '@/utils/formatters';
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

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await onUpdateStatus(bookingId, 'CANCELLED', 'Cancelada pelo viajante');
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
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-card"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={badgeInfo.tone}>{badgeInfo.label}</Badge>
                <span className="text-xs font-mono text-stone-500">{booking.voucherCode}</span>
                <span className="text-xs text-stone-400">· {booking.paymentMethod}</span>
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
              {booking.status !== 'CANCELLED' && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={cancellingId === booking.id}
                  onClick={() => void handleCancel(booking.id)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </div>
  );
};
