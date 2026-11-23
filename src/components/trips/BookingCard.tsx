import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Info, MapPin, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { isSeedShowcaseTrip } from '@/services/bookingService';
import { computeRemainingSpots } from '@/services/tripService';
import { PassengerDetail, PaymentMethod, Trip } from '@/types';
import { formatCurrencyBRL, formatDateRange } from '@/utils/formatters';
import { buildWhatsAppLink } from '@/utils/whatsapp';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GuestCounterRow } from './GuestCounterRow';
import { CompanionFields } from './CompanionFields';

export interface ReservePayload {
  adults: number;
  children: number;
  totalPrice: number;
  departureDate?: string;
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

interface SelectableDeparture {
  key: string;
  startDate: string;
  endDate: string;
  availableSpots: number;
  maxGuests: number;
  price: number;
}

function formatBoardingOption(time: string, location: string): string {
  const cleanLoc = location.trim();
  const cleanTime = time.trim();
  return cleanTime ? `${cleanTime} · ${cleanLoc}` : cleanLoc;
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
  const [adultCompanionNames, setAdultCompanionNames] = useState<string[]>([]);
  const [childCompanionNames, setChildCompanionNames] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const departureOptions = useMemo<SelectableDeparture[]>(() => {
    const baseMax = Math.max(0, trip?.maxGuests ?? 16);
    const baseAvail =
      typeof trip?.availableSpots === 'number' && Number.isFinite(trip.availableSpots)
        ? Math.max(0, trip.availableSpots)
        : baseMax;
    const basePrice = trip?.price ?? 0;

    const primaryOption: SelectableDeparture = {
      key: trip?.startDate || 'primary',
      startDate: trip?.startDate || '',
      endDate: trip?.endDate || '',
      availableSpots: baseAvail,
      maxGuests: baseMax,
      price: basePrice,
    };

    const extras = Array.isArray(trip?.departures)
      ? trip.departures.map((dep) => ({
          key: dep.startDate,
          startDate: dep.startDate,
          endDate: dep.endDate,
          availableSpots: Math.max(0, dep.availableSpots ?? dep.maxGuests),
          maxGuests: Math.max(1, dep.maxGuests),
          price: dep.priceOverride !== undefined ? dep.priceOverride : basePrice,
        }))
      : [];

    const seenDays = new Set<string>();
    const combined: SelectableDeparture[] = [];
    for (const item of [primaryOption, ...extras]) {
      const dayKey = item.startDate ? item.startDate.slice(0, 10) : item.key;
      if (seenDays.has(dayKey)) continue;
      seenDays.add(dayKey);
      combined.push(item);
    }
    return combined;
  }, [trip]);

  const firstAvailableDeparture = useMemo(
    () =>
      (departureOptions.find((opt) => opt.availableSpots > 0) ?? departureOptions[0])?.startDate ??
      '',
    [departureOptions]
  );

  const [selectedDeparture, setSelectedDeparture] = useState<string>(firstAvailableDeparture);

  useEffect(() => {
    setSelectedDeparture(firstAvailableDeparture);
    // Reset default departure only when navigating to a different trip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  const boardingOptions = useMemo(
    () =>
      (Array.isArray(trip?.boardingPoints) ? trip.boardingPoints : [])
        .filter((bp) => bp && typeof bp.location === 'string' && bp.location.trim().length > 0)
        .map((bp, idx) => ({
          key: `${bp.id || 'bp'}-${idx}`,
          label: formatBoardingOption(bp.time ?? '', bp.location),
        })),
    [trip?.boardingPoints]
  );

  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<string>(
    () => boardingOptions[0]?.label ?? ''
  );

  useEffect(() => {
    setSelectedBoardingPoint(boardingOptions[0]?.label ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id]);

  const activeOption = useMemo(
    () =>
      departureOptions.find(
        (opt) => opt.startDate.slice(0, 10) === selectedDeparture.slice(0, 10)
      ) ?? departureOptions[0],
    [departureOptions, selectedDeparture]
  );

  const passengerCfg = trip?.passengerConfig ?? {
    allowChildren: false,
    childAgeLimit: 12,
    childPriceMultiplier: 1,
  };
  const remainingSpots = activeOption
    ? activeOption.availableSpots
    : computeRemainingSpots(trip, selectedDeparture);
  const unitPrice = activeOption ? activeOption.price : (trip?.price ?? 0);

  useEffect(() => {
    if (remainingSpots > 0 && adults + childrenCount > remainingSpots) {
      const clampedAdults = Math.max(1, Math.min(adults, remainingSpots));
      const clampedChildren = Math.max(0, Math.min(childrenCount, remainingSpots - clampedAdults));
      setAdults(clampedAdults);
      setChildrenCount(clampedChildren);
    }
  }, [adults, childrenCount, remainingSpots]);

  const targetAdultCompanions = Math.max(0, adults - 1);

  useEffect(() => {
    setAdultCompanionNames((prev) =>
      Array.from({ length: targetAdultCompanions }, (_, i) => prev[i] ?? '')
    );
  }, [targetAdultCompanions]);

  useEffect(() => {
    setChildCompanionNames((prev) =>
      Array.from({ length: childrenCount }, (_, i) => prev[i] ?? '')
    );
  }, [childrenCount]);

  const companions = useMemo<PassengerDetail[]>(
    () => [
      ...Array.from({ length: targetAdultCompanions }, (_, i) => ({
        name: adultCompanionNames[i] ?? '',
        type: 'adult' as const,
      })),
      ...Array.from({ length: childrenCount }, (_, i) => ({
        name: childCompanionNames[i] ?? '',
        type: 'child' as const,
      })),
    ],
    [adultCompanionNames, childCompanionNames, childrenCount, targetAdultCompanions]
  );

  const handleCompanionChange = (idx: number, value: string) => {
    if (idx < targetAdultCompanions) {
      setAdultCompanionNames((prev) =>
        Array.from({ length: targetAdultCompanions }, (_, i) => (i === idx ? value : (prev[i] ?? '')))
      );
    } else {
      const childIdx = idx - targetAdultCompanions;
      setChildCompanionNames((prev) =>
        Array.from({ length: childrenCount }, (_, i) => (i === childIdx ? value : (prev[i] ?? '')))
      );
    }
  };

  const totalPrice = useMemo(() => {
    const childMultiplier = passengerCfg.allowChildren
      ? (passengerCfg.childPriceMultiplier ?? 0.7)
      : 1;
    return Math.round(unitPrice * (adults + childrenCount * childMultiplier));
  }, [
    adults,
    childrenCount,
    passengerCfg.allowChildren,
    passengerCfg.childPriceMultiplier,
    unitPrice,
  ]);

  const whatsappUrl = buildWhatsAppLink(agencyWhatsapp, trip);
  const maxAdultsAllowed = Math.max(1, remainingSpots - childrenCount);
  const maxChildrenAllowed = Math.max(0, remainingSpots - adults);
  const hasCapacity = Boolean(trip?.isActive) && remainingSpots >= 1;
  const isShowcaseDemo = isSeedShowcaseTrip(trip?.id ?? '');

  const handleSubmit = () => {
    const cleanNotes = notes.trim();
    const combinedNotes = selectedBoardingPoint
      ? cleanNotes
        ? `Embarque: ${selectedBoardingPoint}\n${cleanNotes}`
        : `Embarque: ${selectedBoardingPoint}`
      : cleanNotes;

    void onReserve({
      adults,
      children: childrenCount,
      totalPrice,
      departureDate: activeOption?.startDate || trip.startDate,
      paymentMethod,
      companions,
      notes: combinedNotes,
    });
  };

  return (
    <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-editorial sticky top-24">
      <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Valor por adulto
          </span>
          <p className="text-3xl font-extrabold text-primary-600">{formatCurrencyBRL(unitPrice)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
            {trip?.durationDays ?? 1} dias
          </span>
          <Badge
            tone={remainingSpots === 0 ? 'warning' : remainingSpots <= 4 ? 'secondary' : 'success'}
          >
            {remainingSpots === 0 ? 'Esgotado' : `${remainingSpots} vaga(s) livre(s)`}
          </Badge>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {departureOptions.length > 1 ? (
          <div>
            <label
              htmlFor="departure-select"
              className="block text-xs font-semibold text-stone-600 mb-1.5"
            >
              Escolha a turma / data de saída
            </label>
            <select
              id="departure-select"
              value={selectedDeparture}
              onChange={(e) => setSelectedDeparture(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900"
            >
              {departureOptions.map((opt) => (
                <option key={opt.key} value={opt.startDate} disabled={opt.availableSpots === 0}>
                  {formatDateRange(opt.startDate, opt.endDate)} ·{' '}
                  {opt.availableSpots === 0 ? 'Esgotado' : `${opt.availableSpots} vagas`} ·{' '}
                  {formatCurrencyBRL(opt.price)}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-accent-50 border border-stone-200/80 p-3.5">
            <Calendar size={18} className="text-primary-600 shrink-0" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Período
              </p>
              <p className="text-sm font-semibold text-stone-900">
                {formatDateRange(activeOption?.startDate, activeOption?.endDate)}
              </p>
            </div>
          </div>
        )}

        {boardingOptions.length > 0 && (
          <div>
            <label
              htmlFor="boarding-point-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-1.5"
            >
              <MapPin size={13} className="text-primary-600" />
              Ponto de embarque
            </label>
            <select
              id="boarding-point-select"
              value={selectedBoardingPoint}
              onChange={(e) => setSelectedBoardingPoint(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900"
            >
              {boardingOptions.map((bp) => (
                <option key={bp.key} value={bp.label}>
                  {bp.label}
                </option>
              ))}
            </select>
          </div>
        )}

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

          {passengerCfg.allowChildren && (
            <GuestCounterRow
              withBorder
              label="Crianças"
              subtitle={`Até ${passengerCfg.childAgeLimit ?? 12} anos (${Math.round((passengerCfg.childPriceMultiplier ?? 0.7) * 100)}% do valor)`}
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
          onCompanionChange={handleCompanionChange}
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
            <option value="PIX">Pix (confirmação direta com a operadora)</option>
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
            Roteiro curado demonstrativo. Para reserva online, escolha um pacote publicado por
            nossas operadoras ou fale no WhatsApp abaixo.
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          disabled={isShowcaseDemo || !hasCapacity || submitting}
          loading={submitting}
          onClick={handleSubmit}
        >
          {isShowcaseDemo
            ? 'Pacote vitrine — fale no WhatsApp'
            : hasCapacity
              ? 'Solicitar Reserva'
              : 'Vagas esgotadas nesta saída'}
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
          Operadora cadastrada no ecossistema SouNativo
        </p>
      </div>
    </aside>
  );
};
