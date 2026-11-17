import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeroSearchBarProps {
  initialQuery?: string;
}

export const HeroSearchBar: React.FC<HeroSearchBarProps> = ({ initialQuery = '' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [travelers, setTravelers] = useState('2');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (travelers) params.set('guests', travelers);
    navigate(`/trips?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Buscar viagens no SouNativo"
      className="w-full max-w-3xl rounded-2xl bg-white p-2.5 shadow-2xl border border-white/20 flex flex-col sm:flex-row gap-2"
    >
      <div className="flex-1 flex items-center gap-2.5 px-3 min-h-[46px] rounded-xl bg-accent-50 sm:bg-transparent">
        <MapPin size={18} className="text-secondary-600 shrink-0" aria-hidden="true" />
        <label htmlFor="hero-destination" className="sr-only">
          Para onde você quer viajar?
        </label>
        <input
          id="hero-destination"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Destino, bioma ou experiência (ex: Amazônia, Lençóis...)"
          className="w-full bg-transparent text-sm font-medium text-stone-900 placeholder:text-stone-500 focus:outline-none"
        />
      </div>

      <div className="hidden sm:block w-px bg-stone-200 my-2" aria-hidden="true" />

      <div className="flex items-center gap-2 px-3 min-h-[46px] rounded-xl bg-accent-50 sm:bg-transparent sm:w-44">
        <Users size={18} className="text-primary-600 shrink-0" aria-hidden="true" />
        <label htmlFor="hero-guests" className="sr-only">
          Número de viajantes
        </label>
        <select
          id="hero-guests"
          value={travelers}
          onChange={(e) => setTravelers(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-stone-800 focus:outline-none"
        >
          <option value="1">1 viajante</option>
          <option value="2">2 viajantes</option>
          <option value="4">Grupo (4+)</option>
          <option value="8">Excursão (8+)</option>
        </select>
      </div>

      <Button type="submit" size="md" leftIcon={<Search size={17} />} className="sm:px-6 shrink-0">
        Explorar
      </Button>
    </form>
  );
};
