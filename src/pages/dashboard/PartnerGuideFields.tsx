import React from 'react';
import { GuideDetails } from '@/types';

interface PartnerGuideFieldsProps {
  city: string;
  cadastur: string;
  availability: GuideDetails['availability'];
  languagesText: string;
  specialtiesText: string;
  experienceYears: string;
  onCityChange: (val: string) => void;
  onCadasturChange: (val: string) => void;
  onAvailabilityChange: (val: GuideDetails['availability']) => void;
  onLanguagesChange: (val: string) => void;
  onSpecialtiesChange: (val: string) => void;
  onExperienceChange: (val: string) => void;
}

export const PartnerGuideFields: React.FC<PartnerGuideFieldsProps> = ({
  city,
  cadastur,
  availability,
  languagesText,
  specialtiesText,
  experienceYears,
  onCityChange,
  onCadasturChange,
  onAvailabilityChange,
  onLanguagesChange,
  onSpecialtiesChange,
  onExperienceChange,
}) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label htmlFor="ag-city" className="block text-xs font-semibold text-stone-700 mb-1">
          Cidade base
        </label>
        <input
          id="ag-city"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="ag-cadastur" className="block text-xs font-semibold text-stone-700 mb-1">
          Cadastur / CNPJ
        </label>
        <input
          id="ag-cadastur"
          value={cadastur}
          onChange={(e) => onCadasturChange(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="ag-avail" className="block text-xs font-semibold text-stone-700 mb-1">
          Disponibilidade
        </label>
        <select
          id="ag-avail"
          value={availability}
          onChange={(e) => onAvailabilityChange(e.target.value as GuideDetails['availability'])}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm"
        >
          <option value="FULL_TIME">Tempo integral</option>
          <option value="PART_TIME">Fins de semana / parcial</option>
          <option value="ON_DEMAND">Sob demanda</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label htmlFor="ag-langs" className="block text-xs font-semibold text-stone-700 mb-1">
          Idiomas (vírgula)
        </label>
        <input
          id="ag-langs"
          value={languagesText}
          onChange={(e) => onLanguagesChange(e.target.value)}
          placeholder="Português, Inglês"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="ag-specs" className="block text-xs font-semibold text-stone-700 mb-1">
          Especialidades (vírgula)
        </label>
        <input
          id="ag-specs"
          value={specialtiesText}
          onChange={(e) => onSpecialtiesChange(e.target.value)}
          placeholder="Ecoturismo, Trilhas"
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
      <div>
        <label htmlFor="ag-exp" className="block text-xs font-semibold text-stone-700 mb-1">
          Anos de experiência
        </label>
        <input
          id="ag-exp"
          type="number"
          min="0"
          max="80"
          value={experienceYears}
          onChange={(e) => onExperienceChange(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3 text-sm"
        />
      </div>
    </div>
  </>
);
