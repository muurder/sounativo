import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Info, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { PassengerDetail, PaymentMethod, Trip } from '@/types';
import { formatCurrencyBRL, formatDateRange } from '@/utils/formatters';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { Button } from '@/components/ui/Button';
import { GuestCounterRow } from './GuestCounterRow';
import { CompanionFields } from './CompanionFields';

export interface ReservePayload {
  adults: number;
  children: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  companions: PassengerDetail[];
  notes: string;
}

interface BookingCardProps {
  trip: Trip;
  agencyWhatsapp?: string;
  onReserve: (payload: ReservePayload) => Promise<void>;
  submitting: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  trip,
  agencyWhatsapp,
  onReserve,
  submitting,
}) => {
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [companions, setCompanions] = useState<PassengerDetail[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const targetAdults = Math.max(0, adults - 1);
    const desired: PassengerDetail[] = [
      ...Array.from({ length: targetAdults }, (_, i) => ({
        name: companions[i]?.name ?? '',
        type: 'adult' as const,
      })),
      ...Array.from({ length: childrenCount }, (_, i) => ({
        name: companions[targetAdults + i]?.name ?? '',
        type: 'child' as const,
      })),
    ];
    setCompanions(desired);
    // Intentionally sync companion slots only when guest counts change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, childrenCount]);

  const totalPrice = useMemo(() => {
    const childMultiplier = trip.passengerConfig.allowChildren
      ? trip.passengerConfig.childPriceMultiplier
      : 1;
    return Math.round(trip.price * (adults + childrenCount * childMultiplier));
  }, [adults, childrenCount, trip.passengerConfig, trip.price]);

  const whatsappUrl = buildWhatsAppLink(agencyWhatsapp, trip);
  const maxAdultsAllowed = Math.max(1, trip.maxGuests - childrenCount);
  const maxChildrenAllowed = Math.max(0, trip.maxGuests - adults);
  const hasCapacity = trip.isActive && trip.maxGuests >= 1;
  const isShowcaseDemo = trip.id.startsWith('trip-');

  return (
    <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-editorial sticky top-24">
      <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Valor por adulto
          </span>
          <p className="text-3xl font-extrabold text-primary-600">
            {formatCurrencyBRL(trip.price)}
          </p>
        </div>
        <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
          {trip.durationDays} dias · máx. {trip.maxGuests} vagas
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-accent-50 border border-stone-200/80 p-3.5">
          <Calendar size={18} className="text-primary-600 shrink-0" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Período</p>
            <p className="text-sm font-semibold text-stone-900">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 p-3.5 space-y-3">
          <GuestCounterRow
            label="Adultos"
            subtitle="12 anos ou mais"
            count={adults}
            min={1}
            max={maxAdultsAllowed}
            icon={Users}
            decreaseLabel="Diminuir adultos"
            increaseLabel="Aumentar adultos"
            onChange={setAdults}
          />

          {trip.passengerConfig.allowChildren && (
            <GuestCounterRow
              withBorder
              label="Crianças"
              subtitle={`Até ${trip.passengerConfig.childAgeLimit} anos (${Math.round(trip.passengerConfig.childPriceMultiplier * 100)}% do valor)`}
              count={childrenCount}
              min={0}
              max={maxChildrenAllowed}
              decreaseLabel="Diminuir crianças"
              increaseLabel="Aumentar crianças"
              onChange={setChildrenCount}
            />
          )}
        </div>

        <CompanionFields
          companions={companions}
          notes={notes}
          onNotesChange={setNotes}
          onCompanionChange={(idx, value) =>
            setCompanions((prev) =>
              prev.map((item, i) => (i === idx ? { ...item, name: value } : item))
            )
          }
        />

        <div>
          <label
            htmlFor="payment-method"
            className="block text-xs font-semibold text-stone-600 mb-1.5"
          >
            Forma de pagamento preferida
          </label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900"
          >
            <option value="PIX">Pix (confirmação imediata)</option>
            <option value="CREDIT_CARD">Cartão de Crédito</option>
            <option value="BOLETO">Boleto Bancário</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
          <span className="text-sm font-semibold text-stone-700">Total estimado</span>
          <span className="text-2xl font-extrabold text-stone-900">
            {formatCurrencyBRL(totalPrice)}
          </span>
        </div>

        {isShowcaseDemo && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 leading-snug">
            <Info size={14} className="shrink-0 mt-0.5" />
            Roteiro curado demonstrativo. Para testar reserva gravada no Firestore, publique um
            pacote no Modo Agência / Guia.
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          disabled={!hasCapacity}
          loading={submitting}
          onClick={() =>
            void onReserve({
              adults,
              children: childrenCount,
              totalPrice,
              paymentMethod,
              companions,
              notes: notes.trim(),
            })
          }
        >
          {hasCapacity ? 'Solicitar Reserva' : 'Roteiro temporariamente indisponível'}
        </Button>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#128C7E] text-white text-sm font-semibold hover:bg-[#0F766E] transition-colors"
          >
            <MessageCircle size={18} />
            Tirar dúvidas no WhatsApp
          </a>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500 pt-1">
          <ShieldCheck size={14} className="text-primary-600" />
          Agência verificada pelo ecossistema SouNativo
        </p>
      </div>
    </aside>
  );
};
