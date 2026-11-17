import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState
        title="Página não encontrada"
        description="O caminho que você tentou acessar não existe ou foi reorganizado nesta nova versão do SouNativo."
        actionLabel="Ir para o início"
        onAction={() => navigate('/')}
      />
    </div>
  );
};

export default NotFoundPage;
