import React, { useMemo, useState } from 'react';
import { Calendar, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { PaymentMethod, Trip } from '@/types';
import { formatCurrencyBRL, formatDateRange } from '@/utils/formatters';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { Button } from '@/components/ui/Button';

interface BookingCardProps {
  trip: Trip;
  agencyWhatsapp?: string;
  onReserve: (payload: {
    adults: number;
    children: number;
    totalPrice: number;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
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

  const totalPrice = useMemo(() => {
    const childMultiplier = trip.passengerConfig.allowChildren
      ? trip.passengerConfig.childPriceMultiplier
      : 1;
    return Math.round(trip.price * (adults + childrenCount * childMultiplier));
  }, [adults, childrenCount, trip.passengerConfig, trip.price]);

  const whatsappUrl = buildWhatsAppLink(agencyWhatsapp, trip);

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
          {trip.durationDays} dias
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-stone-900">Adultos</p>
                <p className="text-xs text-stone-500">12 anos ou mais</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Diminuir adultos"
                onClick={() => setAdults((v) => Math.max(1, v - 1))}
                className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100"
              >
                -
              </button>
              <span className="w-6 text-center text-sm font-bold">{adults}</span>
              <button
                type="button"
                aria-label="Aumentar adultos"
                onClick={() => setAdults((v) => Math.min(trip.maxGuests, v + 1))}
                className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100"
              >
                +
              </button>
            </div>
          </div>

          {trip.passengerConfig.allowChildren && (
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <div>
                <p className="text-sm font-semibold text-stone-900">Crianças</p>
                <p className="text-xs text-stone-500">
                  Até {trip.passengerConfig.childAgeLimit} anos (
                  {Math.round(trip.passengerConfig.childPriceMultiplier * 100)}% do valor)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuir crianças"
                  onClick={() => setChildrenCount((v) => Math.max(0, v - 1))}
                  className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-bold">{childrenCount}</span>
                <button
                  type="button"
                  aria-label="Aumentar crianças"
                  onClick={() => setChildrenCount((v) => Math.min(trip.maxGuests - adults, v + 1))}
                  className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

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

        <Button
          fullWidth
          size="lg"
          loading={submitting}
          onClick={() =>
            void onReserve({ adults, children: childrenCount, totalPrice, paymentMethod })
          }
        >
          Solicitar Reserva
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
