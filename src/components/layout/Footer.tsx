import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-800 text-stone-200 border-t border-primary-700 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-4">
            <Logo variant="light" iconSize={28} />
            <p className="text-sm text-primary-100/90 max-w-md leading-relaxed">
              O maior marketplace de viagens e experiências autênticas do Brasil. Conectamos
              viajantes exigentes a agências verificadas e guias nativos especializados.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-200 mb-4">
              Explorar
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/trips" className="hover:text-white transition-colors">
                  Pacotes de Viagem
                </Link>
              </li>
              <li>
                <Link to="/agencies" className="hover:text-white transition-colors">
                  Agências Verificadas
                </Link>
              </li>
              <li>
                <Link to="/guides" className="hover:text-white transition-colors">
                  Guias Cadastur
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Painel do Parceiro
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary-200 mb-4">
              Institucional
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Atendimento
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-700/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-primary-200">
          <p>&copy; {new Date().getFullYear()} SouNativo. Todos os direitos reservados.</p>
          <p>Feito para explorar o Brasil com curadoria e respeito local.</p>
        </div>
      </div>
    </footer>
  );
};
