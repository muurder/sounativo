import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Globe, MapPin } from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

export const GuidesPage: React.FC = () => {
  const { agencies: guides, loading } = useAgencies(true);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-2xl mb-8 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Guias de Turismo Locais
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Profissionais credenciados que vivem o destino e conduzem cada detalhe da sua jornada.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <Skeleton key={n} className="h-56 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              to={`/${guide.slug}`}
              className="group flex flex-col sm:flex-row gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-card hover:border-primary-300 transition-all"
            >
              <SafeImage
                src={guide.logo}
                alt={guide.name}
                loading="lazy"
                className="h-24 w-24 rounded-2xl object-cover border border-stone-200 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">
                    <Award size={12} /> Cadastur {guide.cadastur || 'Ativo'}
                  </Badge>
                  {guide.city && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={12} /> {guide.city}, {guide.state}
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-xl font-bold text-stone-900 group-hover:text-primary-600">
                  {guide.name}
                </h2>
                <p className="text-sm text-stone-600">{guide.description}</p>

                {guide.languages && guide.languages.length > 0 && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 pt-1">
                    <Globe size={13} /> Idiomas: {guide.languages.join(' · ')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidesPage;
