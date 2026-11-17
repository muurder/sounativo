import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';

const BIOMES = [
  {
    title: 'Dunas & Lagoas',
    subtitle: 'Lençóis, litoral nordestino e travessias de 4x4',
    query: 'Lencois',
    image:
      'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Amazônia & Rios',
    subtitle: 'Lodges sustentáveis e expedições com mateiros locais',
    query: 'Amazonia',
    image:
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Chapadas & Quedas',
    subtitle: 'Cachoeiras turquesas, cânions e Foz do Iguaçu',
    query: 'Cachoeiras',
    image:
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Praias & Cidades Históricas',
    subtitle: 'Costa Verde, Paraty e barroco mineiro com guia',
    query: 'Paraty',
    image:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  },
] as const;

export const BiomesDiscoverySection: React.FC = () => (
  <section className="bg-white border-b border-stone-200/70 py-14 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-600">
            Explore por cenário
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Onde o Brasil muda o seu ritmo
          </h2>
        </div>
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 shrink-0"
        >
          Explorar todos os destinos <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {BIOMES.map((biome) => (
          <Link
            key={biome.title}
            to={`/trips?q=${encodeURIComponent(biome.query)}`}
            className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 aspect-[4/3] sm:aspect-[4/5] shadow-card hover:shadow-editorial transition-all"
          >
            <SafeImage
              src={biome.image}
              alt={biome.title}
              loading="lazy"
              className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white space-y-1">
              <h3 className="font-serif text-xl font-bold leading-tight">{biome.title}</h3>
              <p className="text-xs text-stone-200 leading-snug">{biome.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
