import React, { useState } from 'react';
import { CalendarDays, Check, Copy, Printer, Share2, Users } from 'lucide-react';
import { Booking } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrencyBRL } from '@/utils/formatters';

interface BookingVoucherModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({ booking, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const passengers = Array.isArray(booking.passengerDetails) ? booking.passengerDetails : [];
  const totalGuests = (booking.adults ?? 1) + (booking.children ?? 0);
  const formattedDeparture = booking.departureDate
    ? new Date(booking.departureDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    `Voucher SouNativo: ${booking.voucherCode || 'SN-PENDENTE'}\nRoteiro: ${booking.tripTitle}\nOperadora: ${booking.agencyName}${formattedDeparture ? `\nSaída: ${formattedDeparture}` : ''}\nViajantes: ${totalGuests} · Total: ${formatCurrencyBRL(booking.totalPrice)}`
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(booking.voucherCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard denials cleanly
    }
  };

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title="Comprovante de Reserva"
      description="Apresente este código à operadora parceira no momento do embarque."
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
              Código Voucher
            </p>
            <p className="font-mono text-2xl font-extrabold text-primary-900">
              {booking.voucherCode || 'SN-PENDENTE'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={() => void handleCopy()}
          >
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-stone-900">{booking.tripTitle}</span>
            <Badge
              tone={
                booking.status === 'CONFIRMED'
                  ? 'success'
                  : booking.status === 'CANCELLED'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {booking.status === 'CONFIRMED'
                ? 'Confirmada'
                : booking.status === 'CANCELLED'
                  ? 'Cancelada'
                  : 'Pendente'}
            </Badge>
          </div>
          <p className="text-xs text-stone-600">Operadora: {booking.agencyName}</p>
          {formattedDeparture && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
              <CalendarDays size={13} /> Data da turma: {formattedDeparture}
            </p>
          )}
          <p className="text-xs text-stone-600">
            Pagamento: {booking.paymentMethod} · Total:{' '}
            <strong>{formatCurrencyBRL(booking.totalPrice)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 p-3.5 space-y-2">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
            <Users size={13} /> Passageiros ({totalGuests})
          </p>
          {passengers.length === 0 ? (
            <p className="text-xs text-stone-500">
              Titular: {booking.clientName || 'Viajante SouNativo'}
            </p>
          ) : (
            <ul className="space-y-1 text-xs text-stone-700">
              {passengers.map((p, idx) => (
                <li key={`${p?.name ?? 'pax'}-${idx}`}>
                  {idx + 1}. {p?.name || `Passageiro ${idx + 1}`} (
                  {p?.type === 'child' ? 'Criança' : 'Adulto'})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 print:hidden">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Imprimir / Salvar PDF
          </Button>
          <a
            href={whatsappShareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl bg-[#128C7E] px-3.5 text-xs font-semibold text-white hover:bg-[#0F766E] transition-colors"
          >
            <Share2 size={14} /> Compartilhar no WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  );
};
