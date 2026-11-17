import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Globe2, Palette, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CtaBannerSectionProps {
  onPartnerSignup: () => void;
}

export const CtaBannerSection: React.FC<CtaBannerSectionProps> = ({ onPartnerSignup }) => (
  <section className="bg-primary-900 py-14 sm:py-20 text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 border border-white/10 p-7 sm:p-11 shadow-editorial grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-300">
            Para Agências &amp; Guias Credenciados
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            Sua operação merece uma vitrine própria com reserva organizada
          </h2>
          <p className="text-sm sm:text-base text-primary-100 leading-relaxed max-w-xl">
            Crie seu microsite whitelabel, aplique as cores da sua marca, publique pacotes com
            embarques claros e receba pedidos de reserva com voucher pronto.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-primary-50">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary-300 shrink-0" />
              Plano Starter gratuito (até 2 roteiros)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary-300 shrink-0" />
              Selo Cadastur em destaque no catálogo
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary-300 shrink-0" />
              Aprovação de reservas e WhatsApp direto
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-secondary-300 shrink-0" />
              Identidade visual personalizada por link
            </li>
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="secondary" size="lg" onClick={onPartnerSignup}>
              Cadastrar Agência ou Guia <ArrowRight size={18} />
            </Button>
            <Link
              to="/agencies"
              className="inline-flex items-center justify-center min-h-[48px] px-5 rounded-xl border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Ver agências parceiras
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/15 bg-stone-950/55 backdrop-blur-md p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs text-primary-100 font-mono truncate">
                <Globe2 size={14} className="text-secondary-300 shrink-0" />
                <span className="truncate">sounativo.vercel.app/sua-marca</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-200">
                Microsite ativo
              </span>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-100">
                  <Palette size={14} className="text-secondary-300" /> Cores da marca
                </span>
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-4 w-4 rounded-full bg-primary-500 border border-white/40" />
                  <span className="h-4 w-4 rounded-full bg-secondary-500 border border-white/40" />
                  <span className="h-4 w-4 rounded-full bg-stone-100 border border-white/40" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-white/10 p-2.5">
                  <p className="text-[11px] text-primary-200">Roteiros ativos</p>
                  <p className="font-serif text-lg font-bold text-white">Ilimitado</p>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <p className="text-[11px] text-primary-200">Emissão direta</p>
                  <p className="font-serif text-lg font-bold text-white">Voucher Web</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-white text-stone-900 px-3.5 py-2.5 text-xs">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Ticket size={15} className="text-primary-700" />
                Reserva #SN-4F8A
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                Confirmada
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
