import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, Mail, Search, Ticket, XCircle } from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { updateBookingStatusInFirestore } from '@/services/bookingService';
import { formatCurrencyBRL, formatPaymentMethod, formatShortDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { BookingVoucherModal } from './BookingVoucherModal';

interface PartnerBookingsSectionProps {
  bookings: Booking[];
  onBookingUpdated: (bookingId: string, status: BookingStatus, cancellationReason?: string) => void;
}

const FILTER_TABS: Array<{ id: 'ALL' | BookingStatus; label: string }> = [
  { id: 'ALL', label: 'Todas' },
  { id: 'PENDING', label: 'Pendentes' },
  { id: 'CONFIRMED', label: 'Confirmadas' },
  { id: 'CANCELLED', label: 'Canceladas' },
];

function escapeCsvCell(value: string): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [search, setSearch] = useState('');

  const safeBookings = useMemo(() => (Array.isArray(bookings) ? bookings : []), [bookings]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeBookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (b.tripTitle ?? '').toLowerCase().includes(q) ||
        (b.clientName ?? '').toLowerCase().includes(q) ||
        (b.clientEmail ?? '').toLowerCase().includes(q) ||
        (b.voucherCode ?? '').toLowerCase().includes(q)
      );
    });
  }, [safeBookings, search, statusFilter]);

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

  const handleExportManifestCsv = () => {
    if (filteredBookings.length === 0) {
      showToast('Não há reservas no filtro atual para exportar.', 'info');
      return;
    }

    const headers = [
      'Voucher',
      'Roteiro',
      'Saida',
      'Status',
      'Titular',
      'Email',
      'Pagamento',
      'TotalBRL',
      'Passageiro',
      'Tipo',
      'Documento',
      'Telefone',
      'Observacoes',
    ];
    const rows: string[][] = [headers];

    for (const b of filteredBookings) {
      const paxList =
        Array.isArray(b.passengerDetails) && b.passengerDetails.length > 0
          ? b.passengerDetails
          : [{ name: b.clientName || 'Titular', type: 'adult' as const }];
      const departureLabel = b.departureDate ? formatShortDate(b.departureDate) : 'Flexivel';

      for (const pax of paxList) {
        rows.push([
          b.voucherCode || '',
          b.tripTitle || '',
          departureLabel,
          b.status,
          b.clientName || '',
          b.clientEmail || '',
          formatPaymentMethod(b.paymentMethod),
          String(b.totalPrice ?? 0),
          pax.name || '',
          pax.type === 'child' ? 'Crianca' : 'Adulto',
          pax.document || '',
          pax.phone || '',
          b.notes || '',
        ]);
      }
    }

    const csvContent = '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista-embarque-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Lista de embarque (CSV) exportada!', 'success');
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-bold text-stone-900">
          Reservas Recebidas ({filteredBookings.length}/{safeBookings.length})
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Voucher, cliente ou roteiro..."
              className="min-h-[36px] w-full sm:w-52 rounded-xl border border-stone-300 pl-8 pr-3 text-xs"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download size={14} />}
            onClick={handleExportManifestCsv}
          >
            Exportar Lista de Embarque (CSV)
          </Button>
        </div>
      </div>

      {safeBookings.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[32px] rounded-lg px-3 text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <p className="text-sm text-stone-500">
          {safeBookings.length === 0
            ? 'Nenhuma reserva solicitada ainda.'
            : 'Nenhuma reserva encontrada com este filtro.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
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
                    {b.departureDate && (
                      <span className="text-xs text-primary-700 font-medium">
                        · Saída: {formatShortDate(b.departureDate)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-stone-900">{b.tripTitle}</p>
                  <p className="text-xs text-stone-600">
                    {b.clientName} ({b.clientEmail || 'sem e-mail'}) · {b.adults ?? 1} ad.
                    {(b.children ?? 0) > 0 ? `, ${b.children} cri.` : ''} ·{' '}
                    <strong>{formatCurrencyBRL(b.totalPrice)}</strong> ·{' '}
                    {formatPaymentMethod(b.paymentMethod)}
                  </p>
                  {b.notes && <p className="text-xs text-stone-500 italic">Obs.: {b.notes}</p>}
                  {b.cancellationReason && (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 inline-block">
                      Motivo: {b.cancellationReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {b.clientEmail && (
                    <a
                      href={`mailto:${b.clientEmail}?subject=${encodeURIComponent(
                        `SouNativo — Reserva ${b.voucherCode} (${b.tripTitle})`
                      )}`}
                      className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      <Mail size={13} /> E-mail
                    </a>
                  )}
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
