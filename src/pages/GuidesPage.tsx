import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Award, Globe, MapPin, RefreshCw, Search } from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { usePageMeta } from '@/hooks/usePageMeta';
import { normalizeSearchText } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

export const GuidesPage: React.FC = () => {
  const { agencies: guides, loading, error, reload } = useAgencies(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  usePageMeta({
    title: 'Guias de Turismo Credenciados Cadastur',
    description:
      'Conecte-se a guias locais certificados para trilhas, cultura e expedições pelo Brasil.',
    canonicalPath: '/guides',
  });

  const languageOptions = useMemo(() => {
    const set = new Set<string>();
    for (const guide of guides) {
      for (const lang of guide.languages ?? []) {
        if (lang?.trim()) set.add(lang.trim());
      }
    }
    return Array.from(set).sort();
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const query = normalizeSearchText(searchTerm);
    return guides.filter((guide) => {
      if (
        selectedLanguage &&
        !(guide.languages ?? []).some((lang) => lang.trim() === selectedLanguage)
      ) {
        return false;
      }
      if (!query) return true;
      const haystack = normalizeSearchText(
        `${guide.name} ${guide.city ?? ''} ${guide.state ?? ''} ${guide.description ?? ''} ${(guide.specialties ?? []).join(' ')} ${(guide.languages ?? []).join(' ')}`
      );
      return haystack.includes(query);
    });
  }, [guides, searchTerm, selectedLanguage]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="max-w-2xl mb-6 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Guias de Turismo Locais
        </h1>
        <p className="text-sm sm:text-base text-stone-600">
          Profissionais credenciados que vivem o destino e conduzem cada detalhe da sua jornada.
        </p>
      </div>

      {!loading && guides.length > 0 && (
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <label htmlFor="guides-search" className="sr-only">
              Buscar guia por nome, cidade ou especialidade
            </label>
            <input
              id="guides-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar guia, destino, idioma ou especialidade..."
              className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          {languageOptions.length > 0 && (
            <div className="sm:w-52">
              <label htmlFor="guides-language-filter" className="sr-only">
                Filtrar por idioma
              </label>
              <select
                id="guides-language-filter"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="">Todos os idiomas</option>
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-red-200 bg-red-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs text-red-900">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => void reload()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <Skeleton key={n} className="h-56 w-full" />
          ))}
        </div>
      ) : filteredGuides.length === 0 ? (
        <EmptyState
          title="Nenhum guia encontrado"
          description="Ajuste a busca ou o idioma para localizar outros guias credenciados."
          actionLabel={searchTerm || selectedLanguage ? 'Limpar filtros' : undefined}
          onAction={
            searchTerm || selectedLanguage
              ? () => {
                  setSearchTerm('');
                  setSelectedLanguage('');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => (
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
                    <Award size={12} />{' '}
                    {guide.cadastur?.trim() ? `Cadastur ${guide.cadastur.trim()}` : 'Guia Local'}
                  </Badge>
                  {guide.city && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={12} /> {guide.city}
                      {guide.state ? `, ${guide.state}` : ''}
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
