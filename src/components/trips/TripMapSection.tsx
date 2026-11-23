import React from 'react';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Trip } from '@/types';

interface TripMapSectionProps {
  trip: Trip;
}

export const TripMapSection: React.FC<TripMapSectionProps> = ({ trip }) => {
  const hasCoords =
    typeof trip.latitude === 'number' &&
    Number.isFinite(trip.latitude) &&
    typeof trip.longitude === 'number' &&
    Number.isFinite(trip.longitude);

  const destinationQuery = hasCoords
    ? `${trip.latitude},${trip.longitude}`
    : `${trip.destination || 'Brasil'}, Brasil`;

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const embedSrc = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(destinationQuery)}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(destinationQuery)}&t=&z=11&ie=UTF8&iwloc=&output=embed`;

  const externalMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationQuery)}`;
  const boardingPoints = Array.isArray(trip.boardingPoints) ? trip.boardingPoints : [];

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Localização &amp; Pontos de Embarque
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Destino principal: <strong>{trip.destination || 'Brasil'}</strong>
            {hasCoords ? ` (${trip.latitude?.toFixed(4)}, ${trip.longitude?.toFixed(4)})` : ''}
          </p>
        </div>

        <a
          href={externalMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
        >
          Abrir no Google Maps <ExternalLink size={13} />
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 aspect-[16/9] max-h-[340px] w-full">
        <iframe
          title={`Mapa do destino ${trip.destination || trip.title}`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>

      {boardingPoints.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Locais de saída confirmados ({boardingPoints.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {boardingPoints.map((bp) => {
              const bpUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bp.location)}`;
              return (
                <a
                  key={bp.id}
                  href={bpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
                >
                  <span className="inline-flex items-center gap-2 min-w-0 text-xs text-stone-800">
                    <MapPin size={14} className="text-primary-600 shrink-0" />
                    <span className="truncate">
                      <strong>{bp.time}</strong> · {bp.location}
                    </span>
                  </span>
                  <Navigation
                    size={13}
                    className="text-stone-400 group-hover:text-primary-600 shrink-0"
                  />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
