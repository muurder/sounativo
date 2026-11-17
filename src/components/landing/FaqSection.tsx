import React from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Como funciona a reserva pelo SouNativo?',
    a: 'Você escolhe o pacote, informa a quantidade de viajantes e envia a solicitação pela plataforma usando sua conta Google ou e-mail. A agência ou guia parceiro confirma a disponibilidade e libera seu voucher diretamente no painel.',
  },
  {
    q: 'As agências e guias são verificados?',
    a: 'Sim. Trabalhamos com operadoras regionais e guias independentes com registro Cadastur informado no perfil, além de avaliações de viajantes reais.',
  },
  {
    q: 'Posso falar com a agência antes de reservar?',
    a: 'Sim. Cada roteiro e microsite dedicado (/:agencia) traz botão direto de WhatsApp já preenchido com os dados da viagem para você tirar dúvidas sobre embarque, crianças ou acessibilidade.',
  },
  {
    q: 'Sou agência ou guia: quanto custa publicar pacotes?',
    a: 'O plano Starter é gratuito para publicar até 2 roteiros ativos com microsite próprio. Conforme sua operação cresce, você pode evoluir para os planos Básico ou Premium.',
  },
] as const;

export const FaqSection: React.FC = () => (
  <section className="bg-[var(--surface-alt)] border-t border-stone-200/80 py-14 sm:py-20">
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Dúvidas frequentes
        </h2>
        <p className="text-sm sm:text-base text-stone-600">
          Respostas diretas sobre reservas, verificação de parceiros e funcionamento da plataforma.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-stone-200 bg-white open:border-primary-300 open:shadow-card transition-colors"
          >
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm sm:text-base font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown
                size={18}
                className="shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="border-t border-stone-100 px-5 py-4 text-sm text-stone-600 leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  </section>
);
