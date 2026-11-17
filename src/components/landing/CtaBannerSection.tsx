import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CtaBannerSectionProps {
  onPartnerSignup: () => void;
}

export const CtaBannerSection: React.FC<CtaBannerSectionProps> = ({ onPartnerSignup }) => (
  <section className="bg-primary-700 text-white py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
      <div className="max-w-2xl space-y-3">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
          Leve sua agência ou trabalho de guia para viajantes de todo o país.
        </h2>
        <p className="text-sm sm:text-base text-primary-100 leading-relaxed max-w-[60ch]">
          Crie seu microsite personalizado em minutos, publique pacotes e acompanhe solicitações de
          reserva em um painel direto.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <Button variant="secondary" size="lg" onClick={onPartnerSignup}>
          Cadastrar Agência ou Guia
        </Button>
        <Link
          to="/agencies"
          className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
        >
          Ver parceiros <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </section>
);
