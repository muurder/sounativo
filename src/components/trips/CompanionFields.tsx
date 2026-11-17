import React from 'react';
import { PassengerDetail } from '@/types';

interface CompanionFieldsProps {
  companions: PassengerDetail[];
  notes: string;
  onCompanionChange: (index: number, name: string) => void;
  onNotesChange: (notes: string) => void;
}

export const CompanionFields: React.FC<CompanionFieldsProps> = ({
  companions,
  notes,
  onCompanionChange,
  onNotesChange,
}) => (
  <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
    {companions.length > 0 && (
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Nomes dos acompanhantes (opcional)
        </p>
        {companions.map((companion, idx) => (
          <input
            key={`${companion.type}-${idx}`}
            type="text"
            value={companion.name}
            onChange={(e) => onCompanionChange(idx, e.target.value)}
            placeholder={`Acompanhante ${idx + 1} (${companion.type === 'child' ? 'Criança' : 'Adulto'})`}
            className="w-full min-h-[38px] rounded-lg border border-stone-300 bg-white px-2.5 text-xs text-stone-900 focus:border-primary-500 focus:outline-none"
          />
        ))}
      </div>
    )}

    <div>
      <label htmlFor="booking-notes" className="block text-xs font-semibold text-stone-600 mb-1">
        Observações / ponto de embarque preferido
      </label>
      <textarea
        id="booking-notes"
        rows={2}
        maxLength={500}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Restrições alimentares, ponto de embarque, dúvidas..."
        className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs text-stone-900 focus:border-primary-500 focus:outline-none"
      />
    </div>
  </div>
);
