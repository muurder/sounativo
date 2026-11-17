import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Trip } from '@/types';
import { formatCurrencyBRL, formatShortDate } from '@/utils/formatters';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { Button } from '@/components/ui/Button';

interface StickyTripBarProps {
  trip: Trip;
  agencyWhatsapp?: string;
  onScrollToBooking: () => void;
}

export const StickyTripBar: React.FC<StickyTripBarProps> = ({
  trip,
  agencyWhatsapp,
  onScrollToBooking,
}) => {
  const whatsappUrl = buildWhatsAppLink(agencyWhatsapp, trip);

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-30 md:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-editorial"
      role="region"
      aria-label="Resumo rápido de reserva"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-lg font-bold text-primary-700">
              {formatCurrencyBRL(trip.price)}
            </span>
            <span className="text-[11px] text-stone-500">/ pessoa</span>
          </div>
          <p className="truncate text-[11px] font-medium text-stone-600">
            Saída {formatShortDate(trip.startDate)} · {trip.durationDays}{' '}
            {trip.durationDays === 1 ? 'dia' : 'dias'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Tirar dúvida no WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle size={18} />
            </a>
          )}
          <Button variant="secondary" size="sm" onClick={onScrollToBooking}>
            Reservar vaga
          </Button>
        </div>
      </div>
    </div>
  );
};
