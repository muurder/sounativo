import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Ticket } from 'lucide-react';
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
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
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
  onUpdateStatus,
}) => {
  const { showToast } = useToast();
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);

  if (loading) {
    return <p className="text-sm text-stone-500">Carregando reservas...</p>;
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title="Nenhuma reserva ainda"
        description="Quando você solicitar uma reserva em qualquer pacote do SouNativo, ela aparecerá aqui com seu código de voucher."
      />
    );
  }

  const handleCancel = async (bookingId: string) => {
    try {
      await onUpdateStatus(bookingId, 'CANCELLED');
      showToast('Reserva cancelada.', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao cancelar reserva.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const badgeInfo = STATUS_BADGE_MAP[booking.status];
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
                  to={`/viagem/${booking.tripSlug}`}
                  className="inline-flex items-center gap-1.5 hover:text-primary-600"
                >
                  {booking.tripTitle}
                  <ExternalLink size={14} />
                </Link>
              </h3>

              <p className="text-xs text-stone-600">
                {booking.agencyName} · {booking.adults} adulto(s)
                {booking.children > 0 ? `, ${booking.children} criança(s)` : ''} ·{' '}
                <strong>{formatCurrencyBRL(booking.totalPrice)}</strong>
              </p>

              {booking.notes && (
                <p className="text-xs text-stone-500 italic">Obs.: {booking.notes}</p>
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
                <Button variant="ghost" size="sm" onClick={() => void handleCancel(booking.id)}>
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
