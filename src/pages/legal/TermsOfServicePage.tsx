import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export const TermsOfServicePage: React.FC = () => {
  usePageMeta({
    title: 'Termos de Uso',
    description:
      'Condições gerais de uso e intermediação do marketplace SouNativo entre viajantes, agências e guias.',
    canonicalPath: '/terms',
  });

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-stone-800 leading-relaxed space-y-8">
      {/* Header */}
      <header className="border-b border-stone-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider">
          <BookOpen size={14} />
          Termos e Condições Gerais de Uso
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Termos de Uso da Plataforma SouNativo
        </h1>
        <p className="text-sm text-stone-500">
          Última atualização: 17 de novembro de 2026 · Versão: 2026-v1.0
        </p>
      </header>

      {/* Introdução */}
      <section className="space-y-4">
        <p className="text-base text-stone-700">
          Bem-vindo ao <strong>SouNativo</strong>. Ao acessar o site, cadastrar-se ou solicitar
          reservas através da nossa plataforma, você declara ter lido, compreendido e concordado
          integralmente com estes Termos de Uso e com nossa{' '}
          <Link to="/privacy" className="text-primary-700 underline font-medium">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>

      {/* 1. Objeto */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          1. Natureza do Serviço e Papel do SouNativo
        </h2>
        <p className="text-sm text-stone-700">
          O SouNativo é uma plataforma digital que atua como{' '}
          <strong>marketplace intermediador</strong>, cuja função principal é conectar viajantes a
          agências de turismo e guias de turismo independentes credenciados pelo Ministério do
          Turismo (Cadastur).
        </p>
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs sm:text-sm text-stone-600 space-y-2">
          <p>
            <strong>Aviso de Intermediação:</strong> O SouNativo não é proprietário dos meios de
            transporte, embarcações, pousadas ou equipamentos de trilha, tampouco emprega
            diretamente os guias autônomos. A execução física do roteiro, a gestão de vagas, os
            embarques e a segurança em campo são de responsabilidade direta e exclusiva da operadora
            ou guia parceiro anunciado.
          </p>
        </div>
      </section>

      {/* 2. Cadastro e Responsabilidades */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          2. Cadastro do Usuário e Veracidade das Informações
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-stone-700 pl-2">
          <li>
            Para solicitar reservas ou cadastrar pacotes, o usuário deve ser civilmente capaz (maior
            de 18 anos) e fornecer dados verídicos, exatos e atualizados.
          </li>
          <li>
            O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de
            acesso ao Firebase Auth (Google ou e-mail/senha).
          </li>
          <li>
            É terminantemente proibido o uso de identidades falsas, cartões de terceiros sem
            autorização expressa ou a utilização da plataforma para finalidades ilícitas.
          </li>
        </ul>
      </section>

      {/* 3. Agências e Guias Parceiros */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          3. Padrões para Agências e Guias Credenciados
        </h2>
        <p className="text-sm text-stone-700">
          Operadoras e profissionais autônomos que divulgam seus pacotes no SouNativo comprometem-se
          a:
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-stone-600 pl-2">
          <li>
            Manter registro ativo e regular no Cadastur (Ministério do Turismo) para as atividades
            exercidas.
          </li>
          <li>
            Descrever com máxima exatidão os pontos de embarque, horários, nível de dificuldade
            física, itens inclusos e não inclusos.
          </li>
          <li>
            Cumprir integralmente as normas de segurança do trabalho e ecoturismo, incluindo
            condições mínimas de segurança em áreas de preservação ambiental (ICMBio/IBAMA).
          </li>
          <li>
            Atender com cordialidade e presteza os pedidos de reserva e dúvidas enviadas pelos
            viajantes.
          </li>
        </ol>
      </section>

      {/* 4. Reservas e Pagamentos */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          4. Reservas, Emissão de Voucher e Pagamento
        </h2>
        <p className="text-sm text-stone-700">
          A solicitação de reserva na plataforma gera um código de voucher único (exemplo:
          #SN-XXXXX). A confirmação definitiva da vaga ocorre mediante a validação da operadora
          parceira e o pagamento acordado conforme as formas informadas no anúncio (Pix, Cartão de
          Crédito ou transferência bancária).
        </p>
      </section>

      {/* 5. Cancelamento e Reembolso */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          5. Cancelamentos, Remarcações e Código de Defesa do Consumidor
        </h2>
        <div className="space-y-3 text-sm text-stone-700">
          <p>
            <strong>Direito de Arrependimento (Art. 49 do CDC):</strong> Para reservas contratadas
            fora do estabelecimento comercial (online), o consumidor pode desistir no prazo de 7
            (sete) dias corridos a contar da contratação, desde que a solicitação ocorra antes do
            início da prestação do serviço ou viagem.
          </p>
          <p>
            <strong>Condições Climáticas e Força Maior:</strong> Passeios em cenários naturais
            (chapadas, dunas, rios e cachoeiras) estão sujeitos a intempéries extremas (trombas
            d&rsquo;água, cheias ou alertas da defesa civil). Nestes casos, a agência parceira
            poderá oferecer remarcação sem custo, crédito para data futura ou reembolso nos termos
            da legislação aplicável ao turismo (Lei nº 11.771/2008).
          </p>
        </div>
      </section>

      {/* 6. Avaliações e Conduta */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          6. Avaliações e Moderação de Conteúdo
        </h2>
        <p className="text-sm text-stone-700">
          As avaliações publicadas por viajantes refletem impressões reais sobre guias e pacotes. O
          SouNativo reserva-se o direito de remover comentários que contenham linguagem ofensiva,
          difamatória, discurso de ódio ou tentativas de autopromoção spam.
        </p>
      </section>

      {/* 7. Foro e Legislação */}
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-3 text-sm text-stone-700">
        <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary-600" />
          7. Legislação Aplicável e Resolução de Conflitos
        </h2>
        <p className="text-stone-600 leading-relaxed">
          Estes Termos são regidos exclusivamente pelas Leis da República Federativa do Brasil. As
          partes elegem o Foro da Comarca de São Paulo/SP, ou o domicílio do consumidor conforme
          garantido pelo Código de Defesa do Consumidor, para dirimir eventuais litígios.
        </p>
      </section>

      {/* Footer navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200">
        <Link
          to="/privacy"
          className="text-sm font-semibold text-primary-700 hover:text-primary-800"
        >
          Ver Política de Privacidade &rarr;
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center min-h-[36px] rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
        >
          Falar com Atendimento
        </Link>
      </div>
    </article>
  );
};
