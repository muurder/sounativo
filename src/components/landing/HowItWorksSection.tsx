import React from 'react';
import { Compass, MessageCircle, Search, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Escolha o destino',
    description:
      'Compare datas, duração, nível de conforto e o que está incluído em cada roteiro verificado.',
  },
  {
    step: '02',
    icon: MessageCircle,
    title: 'Alinhe os detalhes',
    description:
      'Tire dúvidas direto com a agência ou guia responsável pelo WhatsApp antes de fechar a vaga.',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'Solicite sua reserva',
    description:
      'Gere seu código de reserva autenticado com sua conta Google e acompanhe o status em tempo real.',
  },
  {
    step: '04',
    icon: Compass,
    title: 'Embarque com apoio local',
    description:
      'Receba pontos de encontro e orientações do guia nativo para viver o destino sem improviso.',
  },
] as const;

export const HowItWorksSection: React.FC = () => (
  <section className="bg-[var(--surface-alt)] border-y border-stone-200/80 py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mb-10 space-y-2">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Do planejamento ao embarque, sem ruído
        </h2>
        <p className="text-sm sm:text-base text-stone-600">
          Fluxo transparente conectando você diretamente a quem opera a viagem no território.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.step}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="font-serif text-2xl font-bold text-primary-600/35 tabular-nums">
                  {item.step}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">{item.title}</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{item.description}</p>
            </li>
          );
        })}
      </ol>
    </div>
  </section>
);
