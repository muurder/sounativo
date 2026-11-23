import React, { useState } from 'react';
import { Backpack, Check, ChevronDown, Clock, MapPin, ShieldCheck, X } from 'lucide-react';
import { Trip } from '@/types';
import { cn } from '@/utils/cn';

interface TripItinerarySectionProps {
  trip: Trip;
}

const DEFAULT_PACKING_ITEMS = [
  'Documento oficial com foto e voucher da reserva salvo no celular',
  'Calçado fechado já amaciado com solado aderente para caminhada',
  'Mochila de ataque (20L a 30L) e garrafa reutilizável (mín. 1,5L)',
  'Protetor solar biodegradável, repelente, boné/chapéu e óculos escuros',
  'Camada leve corta-vento/chuva e muda extra de roupa em saco estanque',
] as const;

export const TripItinerarySection: React.FC<TripItinerarySectionProps> = ({ trip }) => {
  const [packingOpen, setPackingOpen] = useState(false);
  const itinerary = Array.isArray(trip?.itinerary) ? trip.itinerary : [];
  const boardingPoints = Array.isArray(trip?.boardingPoints) ? trip.boardingPoints : [];
  const included = Array.isArray(trip?.included) ? trip.included : [];
  const notIncluded = Array.isArray(trip?.notIncluded) ? trip.notIncluded : [];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4 sm:p-5 flex items-start gap-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <div className="space-y-1 text-sm">
          <h2 className="font-serif text-base font-bold text-stone-900">
            Reserva direta &amp; política de remarcação transparente
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Seu pedido registra a pré-reserva diretamente com{' '}
            <strong className="text-stone-800">{trip?.agencyName || 'a operadora parceira'}</strong>{' '}
            sem taxas ocultas de plataforma. Confirme detalhes climáticos, vagas e pagamento direto
            no painel ou WhatsApp.
          </p>
        </div>
      </section>

      {itinerary.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Roteiro dia a dia</h2>
          <div className="space-y-3">
            {itinerary.map((day, idx) => (
              <div
                key={`${day.day ?? idx}-${day.title}`}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-card"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-xs font-bold text-white">
                  D{day.day ?? idx + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-stone-900">{day.title}</h3>
                  <p className="mt-1 text-sm text-stone-600 leading-relaxed">{day.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {boardingPoints.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Pontos de embarque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boardingPoints.map((bp, idx) => (
              <div
                key={bp.id || `bp-${idx}`}
                className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4"
              >
                <MapPin size={18} className="text-secondary-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-stone-900">{bp.location}</p>
                  <p className="inline-flex items-center gap-1 text-xs text-stone-500 mt-0.5">
                    <Clock size={12} /> Horário previsto: {bp.time || 'A combinar'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(included.length > 0 || notIncluded.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2.5">
            <h3 className="font-serif text-lg font-bold text-emerald-950">O que está incluso</h3>
            {included.length === 0 ? (
              <p className="text-xs text-stone-500">Consulte a operadora parceira.</p>
            ) : (
              <ul className="space-y-2 text-sm text-stone-700">
                {included.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 space-y-2.5">
            <h3 className="font-serif text-lg font-bold text-stone-900">Não incluso</h3>
            {notIncluded.length === 0 ? (
              <p className="text-xs text-stone-500">Despesas pessoais não mencionadas acima.</p>
            ) : (
              <ul className="space-y-2 text-sm text-stone-600">
                {notIncluded.map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex items-start gap-2">
                    <X size={16} className="text-stone-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <div
        className={cn(
          'rounded-2xl border bg-white p-5 shadow-card transition-colors',
          packingOpen ? 'border-primary-300' : 'border-stone-200'
        )}
      >
        <button
          type="button"
          aria-expanded={packingOpen}
          aria-controls="trip-packing-checklist"
          onClick={() => setPackingOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 text-left font-serif text-lg font-bold text-stone-900"
        >
          <span className="inline-flex items-center gap-2">
            <Backpack size={18} className="text-secondary-600" aria-hidden="true" />
            Checklist essencial: o que levar na mochila
          </span>
          <ChevronDown
            size={18}
            className={cn(
              'text-stone-500 transition-transform shrink-0',
              packingOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
        {packingOpen && (
          <ul
            id="trip-packing-checklist"
            className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm text-stone-700"
          >
            {DEFAULT_PACKING_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check size={15} className="text-primary-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
