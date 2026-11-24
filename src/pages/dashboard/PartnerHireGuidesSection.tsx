import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Languages, MapPin, MessageCircle, Search, Star } from 'lucide-react';
import { useAgencies } from '@/hooks/useAgencies';
import { Badge } from '@/components/ui/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { buildAgencyWhatsAppLink } from '@/utils/whatsapp';

export const PartnerHireGuidesSection: React.FC = () => {
  const { agencies: allGuides, loading } = useAgencies(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const availableLanguages = useMemo(
    () =>
      Array.from(
        new Set(allGuides.flatMap((g) => (Array.isArray(g.languages) ? g.languages : [])))
      ),
    [allGuides]
  );

  const availableStates = useMemo(
    () => Array.from(new Set(allGuides.map((g) => g.state).filter(Boolean))) as string[],
    [allGuides]
  );

  const filteredGuides = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allGuides.filter((guide) => {
      if (selectedLanguage && !(guide.languages ?? []).includes(selectedLanguage)) {
        return false;
      }
      if (selectedState && guide.state !== selectedState) {
        return false;
      }
      if (!q) return true;
      return (
        guide.name.toLowerCase().includes(q) ||
        (guide.description ?? '').toLowerCase().includes(q) ||
        (guide.city ?? '').toLowerCase().includes(q) ||
        (guide.specialties ?? []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [allGuides, searchTerm, selectedLanguage, selectedState]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Encontre o Guia de Turismo Ideal ({filteredGuides.length})
          </h2>
          <p className="text-xs text-stone-600">
            Conecte-se com guias locais credenciados para operar suas expedições e elevar a
            experiência dos seus pacotes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar guia por nome, cidade ou especialidade..."
              className="w-full min-h-[42px] rounded-xl border border-stone-300 pl-10 pr-3 text-xs"
            />
          </div>

          <div className="relative">
            <Languages
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <select
              aria-label="Filtrar guias por idioma"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-xs font-semibold"
            >
              <option value="">Todos os idiomas</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              aria-label="Filtrar guias por estado"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-semibold"
            >
              <option value="">Todas as regiões / UF</option>
              {availableStates.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Carregando diretório de guias credenciados...</p>
      ) : filteredGuides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
          Nenhum guia encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuides.map((guide) => {
            const phone = guide.whatsapp || guide.phone;
            const waUrl = phone
              ? buildAgencyWhatsAppLink(
                  phone,
                  `Olá ${guide.name}! Vi seu perfil de Guia no SouNativo e gostaria de cotar seus serviços para uma operação.`
                )
              : null;

            return (
              <div
                key={guide.id}
                className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-card flex flex-col justify-between hover:border-primary-300 transition-all"
              >
                <div className="p-5 flex flex-col items-center text-center space-y-2.5">
                  <div className="relative">
                    <SafeImage
                      src={guide.logo}
                      alt={guide.name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-stone-100 shadow-sm"
                    />
                    {(guide.verified || guide.cadastur) && (
                      <span
                        title="Cadastur Verificado"
                        className="absolute bottom-0 right-0 rounded-full bg-white p-1 text-primary-600 shadow"
                      >
                        <CheckCircle2 size={15} />
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-bold text-stone-900">{guide.name}</h3>
                    <p className="inline-flex items-center gap-1 text-xs text-stone-500">
                      <MapPin size={12} className="text-primary-600" />
                      {guide.city ? `${guide.city}, ${guide.state || 'BR'}` : guide.state || 'Brasil'}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    {guide.cadastur && <Badge tone="success">Cadastur {guide.cadastur}</Badge>}
                    {guide.rating && guide.rating > 0 ? (
                      <Badge tone="secondary">
                        <Star size={11} className="fill-current" /> {guide.rating.toFixed(1)}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {guide.description || 'Guia profissional disponível para guiamento e parcerias.'}
                  </p>

                  <div className="flex flex-wrap justify-center gap-1 pt-1">
                    {(guide.languages ?? ['Português']).slice(0, 4).map((lang) => (
                      <span
                        key={lang}
                        className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-700"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-stone-100 bg-stone-50/70 p-3.5 flex items-center gap-2">
                  <Link
                    to={`/${guide.slug}`}
                    className="flex-1 text-center rounded-xl border border-stone-200 bg-white py-2 text-xs font-bold text-stone-700 hover:border-primary-400 hover:text-primary-700 transition-colors"
                  >
                    Ver Perfil
                  </Link>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle size={14} /> Conectar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
