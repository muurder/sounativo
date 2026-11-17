import React from 'react';
import { TripCategory } from '@/types';
import { CATEGORY_LABELS } from '@/utils/constants';

export interface TripFormState {
  title: string;
  destination: string;
  price: string;
  durationDays: string;
  maxGuests: string;
  startDate: string;
  boardingTime: string;
  boardingLocation: string;
  allowChildren: boolean;
  category: TripCategory;
  imageUrl: string;
  includedText: string;
  notIncludedText: string;
  description: string;
}

interface TripFormFieldsProps {
  values: TripFormState;
  onChange: <K extends keyof TripFormState>(field: K, value: TripFormState[K]) => void;
}

export const TripFormFields: React.FC<TripFormFieldsProps> = ({ values, onChange }) => (
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
          Data de saída
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

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label htmlFor="trip-b-time" className="block text-xs font-semibold text-stone-700 mb-1">
          Horário de embarque
        </label>
        <input
          id="trip-b-time"
          type="time"
          value={values.boardingTime}
          onChange={(e) => onChange('boardingTime', e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="trip-b-loc" className="block text-xs font-semibold text-stone-700 mb-1">
          Local de embarque principal
        </label>
        <input
          id="trip-b-loc"
          value={values.boardingLocation}
          onChange={(e) => onChange('boardingLocation', e.target.value)}
          placeholder="Ex: Metrô Barra Funda (SP) ou Aeroporto local"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
    </div>

    <div>
      <label htmlFor="trip-img" className="block text-xs font-semibold text-stone-700 mb-1">
        URL da imagem de capa
      </label>
      <input
        id="trip-img"
        type="url"
        value={values.imageUrl}
        onChange={(e) => onChange('imageUrl', e.target.value)}
        className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label htmlFor="trip-included" className="block text-xs font-semibold text-stone-700 mb-1">
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
