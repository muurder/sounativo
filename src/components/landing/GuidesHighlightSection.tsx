import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, MapPin } from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { Badge } from '@/components/ui/Badge';

export const GuidesHighlightSection: React.FC = () => {
  const { agencies: guides } = useAgencies(true);

  if (guides.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Viaje com Guias Nativos
            </h2>
            <p className="text-sm sm:text-base text-stone-600">
              Especialistas credenciados no Cadastur que conhecem a história e a geografia local.
            </p>
          </div>
          <Link
            to="/guides"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 shrink-0"
          >
            Conhecer todos os guias <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.slice(0, 2).map((guide) => (
            <Link
              key={guide.id}
              to={`/${guide.slug}`}
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl border border-stone-200 bg-accent-50/40 p-5 shadow-card hover:border-primary-300 hover:bg-white hover:shadow-editorial transition-all"
            >
              <img
                src={guide.logo}
                alt={guide.name}
                loading="lazy"
                className="h-20 w-20 rounded-2xl object-cover shrink-0 border border-stone-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge tone="primary">
                    <Award size={12} /> Cadastur {guide.cadastur || 'Verificado'}
                  </Badge>
                  {guide.city && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={12} /> {guide.city}, {guide.state}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-primary-600 transition-colors">
                  {guide.name}
                </h3>
                <p className="mt-1 text-sm text-stone-600 line-clamp-2">{guide.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
