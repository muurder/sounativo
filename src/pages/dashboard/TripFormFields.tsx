import React, { useMemo } from 'react';
import { CalendarPlus, MapPin, Plus, Trash2 } from 'lucide-react';
import { BoardingPoint, ItineraryDay, TripCategory } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField';

export interface DepartureFormRow {
  id: string;
  startDate: string;
  maxGuests: string;
  availableSpots?: number;
  priceOverride: string;
}

export interface TripFormState {
  title: string;
  destination: string;
  latitude: string;
  longitude: string;
  price: string;
  durationDays: string;
  maxGuests: string;
  startDate: string;
  departures: DepartureFormRow[];
  boardingPoints: BoardingPoint[];
  allowChildren: boolean;
  category: TripCategory;
  imageUrl: string;
  extraImagesText: string;
  includedText: string;
  notIncludedText: string;
  itinerary: ItineraryDay[];
  description: string;
}

interface TripFormFieldsProps {
  values: TripFormState;
  onChange: <K extends keyof TripFormState>(field: K, value: TripFormState[K]) => void;
}

export const TripFormFields: React.FC<TripFormFieldsProps> = ({ values, onChange }) => {
  const extraImageUrls = useMemo(
    () =>
      values.extraImagesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s)),
    [values.extraImagesText]
  );

  const handleAddDeparture = () => {
    const nextIndex = values.departures.length + 1;
    const fallbackDate = new Date(Date.now() + (14 + nextIndex * 7) * 86_400_000)
      .toISOString()
      .slice(0, 10);
    onChange('departures', [
      ...values.departures,
      {
        id: `dep-${Date.now().toString(36)}-${nextIndex}`,
        startDate: fallbackDate,
        maxGuests: values.maxGuests || '16',
        priceOverride: '',
      },
    ]);
  };

  const handleUpdateDeparture = (index: number, patch: Partial<DepartureFormRow>) => {
    onChange(
      'departures',
      values.departures.map((dep, idx) => (idx === index ? { ...dep, ...patch } : dep))
    );
  };

  const handleRemoveDeparture = (index: number) => {
    onChange(
      'departures',
      values.departures.filter((_, idx) => idx !== index)
    );
  };

  const handleAddBoarding = () => {
    const nextIndex = values.boardingPoints.length + 1;
    onChange('boardingPoints', [
      ...values.boardingPoints,
      { id: `bp-${Date.now().toString(36)}-${nextIndex}`, time: '07:00', location: '' },
    ]);
  };

  const handleUpdateBoarding = (index: number, patch: Partial<BoardingPoint>) => {
    onChange(
      'boardingPoints',
      values.boardingPoints.map((bp, idx) => (idx === index ? { ...bp, ...patch } : bp))
    );
  };

  const handleRemoveBoarding = (index: number) => {
    onChange(
      'boardingPoints',
      values.boardingPoints.filter((_, idx) => idx !== index)
    );
  };

  const handleAddItineraryDay = () => {
    const nextDay = values.itinerary.length + 1;
    onChange('itinerary', [
      ...values.itinerary,
      { day: nextDay, title: `Dia ${nextDay}`, description: '' },
    ]);
  };

  const handleUpdateItineraryDay = (index: number, patch: Partial<ItineraryDay>) => {
    onChange(
      'itinerary',
      values.itinerary.map((item, idx) => (idx === index ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveItineraryDay = (index: number) => {
    const reindexed = values.itinerary
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, day: idx + 1 }));
    onChange('itinerary', reindexed);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="trip-title" className="block text-xs font-semibold text-stone-700 mb-1">
          Título do pacote
        </label>
        <input
          id="trip-title"
          required
          maxLength={160}
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Ex: Travessia Chapada Diamantina"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="trip-dest" className="block text-xs font-semibold text-stone-700 mb-1">
            Destino
          </label>
          <input
            id="trip-dest"
            required
            maxLength={160}
            value={values.destination}
            onChange={(e) => onChange('destination', e.target.value)}
            placeholder="Lençóis, BA"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="trip-cat" className="block text-xs font-semibold text-stone-700 mb-1">
            Categoria
          </label>
          <select
            id="trip-cat"
            value={values.category}
            onChange={(e) => onChange('category', e.target.value as TripCategory)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
          >
            {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>)
              .filter((k) => k !== 'ALL')
              .map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key]}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Optional Coordinates for Interactive Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3">
        <div>
          <label
            htmlFor="trip-lat"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 mb-1"
          >
            <MapPin size={12} className="text-primary-600" /> Latitude (opcional)
          </label>
          <input
            id="trip-lat"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={values.latitude}
            onChange={(e) => onChange('latitude', e.target.value)}
            placeholder="Ex: -12.5631"
            className="w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
          />
        </div>
        <div>
          <label
            htmlFor="trip-lng"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 mb-1"
          >
            <MapPin size={12} className="text-primary-600" /> Longitude (opcional)
          </label>
          <input
            id="trip-lng"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={values.longitude}
            onChange={(e) => onChange('longitude', e.target.value)}
            placeholder="Ex: -41.3889"
            className="w-full min-h-[40px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label htmlFor="trip-price" className="block text-xs font-semibold text-stone-700 mb-1">
            Valor (R$)
          </label>
          <input
            id="trip-price"
            type="number"
            min="0"
            max="1000000"
            required
            value={values.price}
            onChange={(e) => onChange('price', e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="trip-days" className="block text-xs font-semibold text-stone-700 mb-1">
            Duração (dias)
          </label>
          <input
            id="trip-days"
            type="number"
            min="1"
            max="90"
            required
            value={values.durationDays}
            onChange={(e) => onChange('durationDays', e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="trip-guests" className="block text-xs font-semibold text-stone-700 mb-1">
            Máx. vagas
          </label>
          <input
            id="trip-guests"
            type="number"
            min="1"
            max="100"
            required
            value={values.maxGuests}
            onChange={(e) => onChange('maxGuests', e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>

        <div>
          <label htmlFor="trip-start" className="block text-xs font-semibold text-stone-700 mb-1">
            Data principal
          </label>
          <input
            id="trip-start"
            type="date"
            required
            value={values.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-2.5 text-sm"
          />
        </div>
      </div>

      {/* Multiple Departures / Turmas */}
      <div className="rounded-xl border border-stone-200 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700">
            <CalendarPlus size={14} className="text-primary-600" />
            Turmas / Datas Extras de Saída ({values.departures.length})
          </span>
          <button
            type="button"
            onClick={handleAddDeparture}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Plus size={13} /> Nova turma
          </button>
        </div>

        {values.departures.length === 0 ? (
          <p className="text-xs text-stone-400">
            Opcional: cadastre datas adicionais para controlar estoque de vagas por turma.
          </p>
        ) : (
          <div className="space-y-2">
            {values.departures.map((dep, idx) => (
              <div key={dep.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="date"
                  aria-label={`Data da turma ${idx + 1}`}
                  value={dep.startDate}
                  onChange={(e) => handleUpdateDeparture(idx, { startDate: e.target.value })}
                  className="col-span-5 sm:col-span-5 min-h-[40px] rounded-xl border border-stone-300 px-2.5 text-xs"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  aria-label={`Vagas da turma ${idx + 1}`}
                  value={dep.maxGuests}
                  onChange={(e) => handleUpdateDeparture(idx, { maxGuests: e.target.value })}
                  placeholder="Vagas"
                  className="col-span-3 sm:col-span-3 min-h-[40px] rounded-xl border border-stone-300 px-2.5 text-xs"
                />
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  aria-label={`Valor especial turma ${idx + 1}`}
                  value={dep.priceOverride}
                  onChange={(e) => handleUpdateDeparture(idx, { priceOverride: e.target.value })}
                  placeholder="R$ (opcional)"
                  className="col-span-3 sm:col-span-3 min-h-[40px] rounded-xl border border-stone-300 px-2.5 text-xs"
                />
                <button
                  type="button"
                  aria-label={`Remover turma ${idx + 1}`}
                  onClick={() => handleRemoveDeparture(idx)}
                  className="col-span-1 flex justify-center text-stone-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boarding Points */}
      <div className="rounded-xl border border-stone-200 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-700">
            Pontos de Embarque ({values.boardingPoints.length})
          </span>
          <button
            type="button"
            onClick={handleAddBoarding}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Plus size={13} /> Adicionar embarque
          </button>
        </div>

        {values.boardingPoints.map((bp, idx) => (
          <div key={bp.id} className="grid grid-cols-12 gap-2 items-center">
            <input
              type="time"
              aria-label={`Horário embarque ${idx + 1}`}
              value={bp.time}
              onChange={(e) => handleUpdateBoarding(idx, { time: e.target.value })}
              className="col-span-4 sm:col-span-3 min-h-[40px] rounded-xl border border-stone-300 px-2.5 text-xs"
            />
            <input
              type="text"
              aria-label={`Local embarque ${idx + 1}`}
              value={bp.location}
              onChange={(e) => handleUpdateBoarding(idx, { location: e.target.value })}
              placeholder="Ex: Metrô Barra Funda (SP)"
              className="col-span-7 sm:col-span-8 min-h-[40px] rounded-xl border border-stone-300 px-3 text-xs"
            />
            <button
              type="button"
              aria-label={`Remover embarque ${idx + 1}`}
              onClick={() => handleRemoveBoarding(idx)}
              className="col-span-1 flex justify-center text-stone-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Direct Firebase Storage Cover + Gallery Uploads */}
      <ImageUploadField
        id="trip-cover-upload"
        label="Foto principal (capa do pacote)"
        scope="trips"
        previewShape="wide"
        value={values.imageUrl}
        onChange={(url) => onChange('imageUrl', url)}
      />

      <MultiImageUploadField
        id="trip-gallery-upload"
        label="Galeria extra do roteiro"
        scope="trips"
        urls={extraImageUrls}
        maxImages={12}
        onChange={(nextUrls) => onChange('extraImagesText', nextUrls.join(', '))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="trip-included"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            O que inclui (vírgula)
          </label>
          <input
            id="trip-included"
            value={values.includedText}
            onChange={(e) => onChange('includedText', e.target.value)}
            placeholder="Guia credenciado, Transfer local"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="trip-not-included"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            Não inclui (vírgula)
          </label>
          <input
            id="trip-not-included"
            value={values.notIncludedText}
            onChange={(e) => onChange('notIncludedText', e.target.value)}
            placeholder="Despesas pessoais, Alimentação"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
          />
        </div>
      </div>

      {/* Day-by-day Itinerary Builder */}
      <div className="rounded-xl border border-stone-200 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-700">
            Roteiro Dia a Dia ({values.itinerary.length} dia(s))
          </span>
          <button
            type="button"
            onClick={handleAddItineraryDay}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
          >
            <Plus size={13} /> Adicionar dia
          </button>
        </div>

        {values.itinerary.length === 0 ? (
          <p className="text-xs text-stone-400">
            Opcional: detalhe o cronograma por dia para aumentar a conversão do pacote.
          </p>
        ) : (
          <div className="space-y-2.5">
            {values.itinerary.map((dayItem, idx) => (
              <div
                key={`day-${dayItem.day}-${idx}`}
                className="rounded-xl border border-stone-100 bg-stone-50/70 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-primary-700">Dia {dayItem.day}</span>
                  <button
                    type="button"
                    aria-label={`Remover dia ${dayItem.day}`}
                    onClick={() => handleRemoveItineraryDay(idx)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={120}
                  value={dayItem.title}
                  onChange={(e) => handleUpdateItineraryDay(idx, { title: e.target.value })}
                  placeholder="Título do dia (ex: Chegada e trilha do pôr do sol)"
                  className="w-full min-h-[38px] rounded-xl border border-stone-300 bg-white px-3 text-xs"
                />
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={dayItem.description}
                  onChange={(e) => handleUpdateItineraryDay(idx, { description: e.target.value })}
                  placeholder="Atividades previstas, caminhada, refeições..."
                  className="w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">
        <input
          type="checkbox"
          checked={values.allowChildren}
          onChange={(e) => onChange('allowChildren', e.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-primary-600"
        />
        Permitir reserva de crianças (30% de desconto automático até 12 anos)
      </label>

      <div>
        <label htmlFor="trip-desc" className="block text-xs font-semibold text-stone-700 mb-1">
          Descrição da experiência
        </label>
        <textarea
          id="trip-desc"
          rows={3}
          required
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Descreva os destaques e diferenciais do roteiro..."
          className="w-full rounded-xl border border-stone-300 p-3 text-sm"
        />
      </div>
    </div>
  );
};
