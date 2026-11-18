import React, { useState } from 'react';
import { CheckCircle2, Ticket, XCircle } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { updateBookingStatusInFirestore } from '@/services/bookingService';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { BookingVoucherModal } from './BookingVoucherModal';

interface PartnerBookingsSectionProps {
  bookings: Booking[];
  onBookingUpdated: (bookingId: string, status: BookingStatus, cancellationReason?: string) => void;
}

export const PartnerBookingsSection: React.FC<PartnerBookingsSectionProps> = ({
  bookings,
  onBookingUpdated,
}) => {
  const { showToast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Booking | null>(null);

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const handleStatusChange = async (
    bookingId: string,
    nextStatus: BookingStatus,
    reason?: string
  ) => {
    setBusyId(bookingId);
    try {
      const cleanReason = reason?.trim() || undefined;
      await updateBookingStatusInFirestore(bookingId, nextStatus, cleanReason);
      onBookingUpdated(bookingId, nextStatus, cleanReason);
      setCancellingId(null);
      setCancelReason('');
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
        Reservas Recebidas ({safeBookings.length})
      </h3>

      {safeBookings.length === 0 ? (
        <p className="text-sm text-stone-500">Nenhuma reserva solicitada ainda.</p>
      ) : (
        <div className="space-y-3">
          {safeBookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-stone-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      {b.status === 'CONFIRMED'
                        ? 'Confirmada'
                        : b.status === 'CANCELLED'
                          ? 'Cancelada'
                          : 'Pendente'}
                    </Badge>
                    <span className="text-xs font-mono text-stone-500">{b.voucherCode}</span>
                  </div>
                  <p className="font-semibold text-sm text-stone-900">{b.tripTitle}</p>
                  <p className="text-xs text-stone-600">
                    {b.clientName} ({b.clientEmail || 'sem e-mail'}) · {b.adults ?? 1} ad.
                    {(b.children ?? 0) > 0 ? `, ${b.children} cri.` : ''} ·{' '}
                    <strong>{formatCurrencyBRL(b.totalPrice)}</strong> · {b.paymentMethod}
                  </p>
                  {b.notes && <p className="text-xs text-stone-500 italic">Obs.: {b.notes}</p>}
                  {b.cancellationReason && (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 inline-block">
                      Motivo: {b.cancellationReason}
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
                    Passageiros
                  </Button>

                  {b.status === 'PENDING' && (
                    <Button
                      size="sm"
                      loading={busyId === b.id}
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() => void handleStatusChange(b.id, 'CONFIRMED')}
                    >
                      Confirmar
                    </Button>
                  )}

                  {b.status !== 'CANCELLED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === b.id}
                      leftIcon={<XCircle size={14} className="text-red-600" />}
                      onClick={() => {
                        setCancellingId(cancellingId === b.id ? null : b.id);
                        setCancelReason('');
                      }}
                    >
                      {b.status === 'PENDING' ? 'Recusar' : 'Cancelar'}
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
                    placeholder="Motivo da recusa ou cancelamento (opcional)..."
                    className="flex-1 min-h-[38px] rounded-xl border border-stone-300 px-3 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busyId === b.id}
                    onClick={() =>
                      void handleStatusChange(
                        b.id,
                        'CANCELLED',
                        cancelReason || 'Cancelada pela operadora'
                      )
                    }
                  >
                    Confirmar cancelamento
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BookingVoucherModal booking={selectedVoucher} onClose={() => setSelectedVoucher(null)} />
    </section>
  );
};
