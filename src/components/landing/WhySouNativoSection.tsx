import React from 'react';
import { BadgeCheck, CalendarCheck2, HeartHandshake, ShieldCheck, Wallet } from 'lucide-react';

const PILLARS = [
  {
    icon: BadgeCheck,
    title: 'Turismo Legal no Cadastur',
    description:
      'Operadoras e guias exibem número de registro ativo, especialidades e idiomas antes de você fechar qualquer pacote.',
  },
  {
    icon: Wallet,
    title: 'Preço claro, sem surpresa final',
    description:
      'O que está incluído, o que não inclui, descontos infantis e pontos de embarque ficam abertos desde o primeiro clique.',
  },
  {
    icon: HeartHandshake,
    title: 'Contato humano antes do embarque',
    description:
      'Converse pelo WhatsApp direto com quem conduz o grupo — tire dúvidas sobre clima, trilha ou bagagem sem robôs.',
  },
  {
    icon: CalendarCheck2,
    title: 'Voucher e reserva rastreáveis',
    description:
      'Acompanhe a aprovação da vaga em tempo real no seu painel e leve seu código de voucher salvo no celular.',
  },
] as const;

export const WhySouNativoSection: React.FC = () => (
  <section className="bg-white border-b border-stone-200/70 py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PILLARS.map((item, idx) => {
            const Icon = item.icon;
            const highlighted = idx === 0;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border p-5 space-y-2.5 ${
                  highlighted
                    ? 'border-primary-300 bg-primary-50/60'
                    : 'border-stone-200 bg-white shadow-card'
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                    highlighted ? 'bg-primary-600 text-white' : 'bg-stone-100 text-primary-700'
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="font-serif text-lg font-bold text-stone-900">{item.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5 rounded-3xl border border-stone-200 bg-[var(--surface-alt)] p-7 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700">
            <ShieldCheck size={16} />
            Ecossistema de Confiança
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
            Feito para quem viaja sozinho, em casal, família ou amigos
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            Do bate-volta litorâneo às travessias de vários dias na Amazônia ou Chapadas, o
            SouNativo une curadoria editorial à transparência de quem realmente conhece cada região.
          </p>

          <dl className="grid grid-cols-3 gap-3 border-y border-stone-200 py-4 text-center">
            <div>
              <dt className="text-[11px] text-stone-500">Operadoras</dt>
              <dd className="font-serif text-lg font-bold text-primary-700">Verificadas</dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Microsites</dt>
              <dd className="font-serif text-lg font-bold text-primary-700">100% Web</dd>
            </div>
            <div>
              <dt className="text-[11px] text-stone-500">Intermediação</dt>
              <dd className="font-serif text-lg font-bold text-primary-700">Zero ruído</dd>
            </div>
          </dl>

          <p className="text-xs text-stone-500">
            Agências e agentes independentes gerenciam pacotes, cores próprias e reservas em um só
            painel gratuito para começar.
          </p>
        </div>
      </div>
    </div>
  </section>
);
