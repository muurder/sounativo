import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

const GROUP_PROFILES = ['Amigos', 'Família', 'Corporativo', 'Turma / Faculdade'] as const;
const TARGET_MONTHS = [
  'Dezembro 2026',
  'Janeiro 2027',
  'Fevereiro 2027 (Carnaval)',
  'Outro período flexível',
] as const;

export const GroupQuoteSection: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [destination, setDestination] = useState('Chapada dos Veadeiros');
  const [travelers, setTravelers] = useState(10);
  const [month, setMonth] = useState<string>(TARGET_MONTHS[1]);
  const [groupType, setGroupType] = useState<string>(GROUP_PROFILES[0]);

  const quoteSummary = useMemo(() => {
    const cleanDest = destination.trim() || 'Destino a definir';
    return `Solicitação de grupo (${groupType}): ${travelers} viajantes para ${cleanDest} em ${month}. Gostaria de opções de roteiro fechado com agência verificada.`;
  }, [destination, groupType, month, travelers]);

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(quoteSummary).catch(() => undefined);
    }
    showToast('Rascunho do grupo preparado no formulário de atendimento.', 'success');
    navigate(`/contact?msg=${encodeURIComponent(quoteSummary)}`);
  };

  return (
    <section className="bg-white border-b border-stone-200/70 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-secondary-600">
              <Sparkles size={14} aria-hidden="true" />
              Grupos &amp; Sob Medida
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              Monte uma saída fechada para sua família, turma ou empresa
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-[54ch]">
              Quer adaptar datas, ponto de embarque ou nível de trilha para um grupo fechado? Envie
              os dados básicos e conectamos você diretamente às operadoras especialistas no destino.
            </p>

            <ul className="space-y-2.5 text-sm text-stone-700 pt-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Condições diferenciadas a partir de 6 viajantes no mesmo grupo.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Personalização de hospedagem, transporte privativo e guia bilíngue.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-primary-600 shrink-0 mt-0.5" />
                <span>Proposta clara com inclusão e política de cancelamento detalhadas.</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6">
            <form
              onSubmit={handleRequestQuote}
              className="rounded-3xl border border-stone-200 bg-[var(--surface-alt)] p-6 sm:p-7 shadow-editorial space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-1">
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Simulador rápido de grupo
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-stone-200 px-2.5 py-1 text-xs font-semibold text-primary-700">
                  <Users size={13} /> Sem compromisso
                </span>
              </div>

              <div>
                <label
                  htmlFor="quote-destination"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Destino ou bioma desejado
                </label>
                <input
                  id="quote-destination"
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ex.: Lençóis Maranhenses, Amazônia, Bonito..."
                  className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="quote-travelers"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Viajantes
                  </label>
                  <input
                    id="quote-travelers"
                    type="number"
                    min={4}
                    max={80}
                    value={travelers}
                    onChange={(e) => setTravelers(Math.max(4, Number(e.target.value) || 4))}
                    className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="quote-month"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Previsão
                  </label>
                  <select
                    id="quote-month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {TARGET_MONTHS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quote-profile"
                    className="block text-xs font-semibold text-stone-700 mb-1"
                  >
                    Estilo do grupo
                  </label>
                  <select
                    id="quote-profile"
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    {GROUP_PROFILES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-600 leading-relaxed">
                <strong className="text-stone-800">Resumo:</strong> {quoteSummary}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto">
                  Solicitar orçamento <ArrowRight size={16} />
                </Button>
                <a
                  href={`mailto:suporte@sounativo.com?subject=${encodeURIComponent(
                    `Orçamento grupo — ${destination.trim() || 'SouNativo'}`
                  )}&body=${encodeURIComponent(quoteSummary)}`}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs font-semibold text-primary-700 hover:text-primary-800"
                >
                  <Mail size={14} /> Enviar direto por e-mail
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
