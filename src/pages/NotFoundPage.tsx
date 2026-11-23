import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home, MapPin, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20 text-center">
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-8 sm:p-12 shadow-card">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Compass size={32} />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-stone-600 leading-relaxed">
          O caminho que você tentou acessar não existe ou foi reorganizado nesta nova versão do SouNativo.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/')} leftIcon={<Home size={16} />}>
            Ir para o início
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/trips')}
            leftIcon={<MapPin size={16} />}
          >
            Explorar viagens
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/?auth=signup')}
            leftIcon={<UserPlus size={16} />}
          >
            Criar conta
          </Button>
        </div>

        <div className="mt-8 border-t border-stone-100 pt-6 text-xs text-stone-500">
          Dúvidas ou precisa de ajuda?{' '}
          <Link to="/contact" className="font-semibold text-primary-600 hover:underline">
            Fale com nosso atendimento
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
