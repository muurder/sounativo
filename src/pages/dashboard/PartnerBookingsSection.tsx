import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { updateBookingStatusInFirestore } from '@/services/bookingService';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PartnerBookingsSectionProps {
  bookings: Booking[];
  onBookingUpdated: (bookingId: string, status: BookingStatus) => void;
}

export const PartnerBookingsSection: React.FC<PartnerBookingsSectionProps> = ({
  bookings,
  onBookingUpdated,
}) => {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleStatusChange = async (bookingId: string, nextStatus: BookingStatus) => {
    setBusyId(bookingId);
    try {
      await updateBookingStatusInFirestore(bookingId, nextStatus);
      onBookingUpdated(bookingId, nextStatus);
      showToast(
        nextStatus === 'CONFIRMED' ? 'Reserva confirmada!' : 'Reserva cancelada.',
        nextStatus === 'CONFIRMED' ? 'success' : 'info'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar reserva.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
      <h3 className="font-serif text-xl font-bold text-stone-900">
        Reservas Recebidas ({bookings.length})
      </h3>

      {bookings.length === 0 ? (
        <p className="text-sm text-stone-500">Nenhuma reserva solicitada ainda.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
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
                </div>
                <p className="font-semibold text-sm text-stone-900">{b.tripTitle}</p>
                <p className="text-xs text-stone-600">
                  {b.clientName} ({b.clientEmail}) · {b.adults} ad.
                  {b.children > 0 ? `, ${b.children} cri.` : ''} ·{' '}
                  <strong>{formatCurrencyBRL(b.totalPrice)}</strong> · {b.paymentMethod}
                </p>
                {b.notes && <p className="text-xs text-stone-500 italic">Obs.: {b.notes}</p>}
              </div>

              {b.status === 'PENDING' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    loading={busyId === b.id}
                    leftIcon={<CheckCircle2 size={14} />}
                    onClick={() => void handleStatusChange(b.id, 'CONFIRMED')}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === b.id}
                    leftIcon={<XCircle size={14} />}
                    onClick={() => void handleStatusChange(b.id, 'CANCELLED')}
                  >
                    Recusar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
