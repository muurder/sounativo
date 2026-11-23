import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useConsent } from '@/hooks/useConsent';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/Button';

export const PrivacyPolicyPage: React.FC = () => {
  const { openConsentBanner } = useConsent();

  usePageMeta({
    title: 'Política de Privacidade',
    description:
      'Como o SouNativo coleta, trata e protege seus dados pessoais em conformidade com a LGPD.',
    canonicalPath: '/privacy',
  });

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-stone-800 leading-relaxed space-y-8">
      {/* Header */}
      <header className="border-b border-stone-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider">
          <ShieldCheck size={14} />
          Conformidade LGPD (Lei nº 13.709/2018) &amp; GDPR
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Política de Privacidade e Proteção de Dados
        </h1>
        <p className="text-sm text-stone-500">
          Última atualização: 17 de novembro de 2026 · Versão do documento: 2026-v1.0
        </p>
      </header>

      {/* Introdução */}
      <section className="space-y-4">
        <p className="text-base text-stone-700">
          O <strong>SouNativo</strong> (&ldquo;nós&rdquo;, &ldquo;plataforma&rdquo; ou
          &ldquo;marketplace&rdquo;), acessível através do endereço{' '}
          <a href="https://sounativo.vercel.app" className="text-primary-700 underline font-medium">
            sounativo.vercel.app
          </a>
          , atua como intermediador tecnológico conectando viajantes a agências de turismo e guias
          independentes credenciados pelo Ministério do Turismo (Cadastur).
        </p>
        <p className="text-sm text-stone-600">
          Esta Política de Privacidade descreve, com transparência e clareza, como coletamos,
          utilizamos, armazenamos, compartilhamos e descartamos os seus dados pessoais, além de
          detalhar os canais de exercício dos seus direitos como titular de dados.
        </p>
      </section>

      {/* 1. Bases Legais e Princípios */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          1. Bases Legais e Princípios Orientadores
        </h2>
        <p className="text-sm text-stone-700">
          O tratamento de dados pessoais no SouNativo fundamenta-se estritamente nas hipóteses do
          artigo 7º da LGPD:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-stone-600 pl-2">
          <li>
            <strong>Execução de Contrato e Procedimentos Preliminares (Art. 7º, V):</strong> para
            processamento de reservas, emissão de vouchers, login e comunicação direta com a
            agência.
          </li>
          <li>
            <strong>Consentimento Livre e Informado (Art. 7º, I):</strong> para cookies analíticos,
            cookies de marketing e preferências opcionais.
          </li>
          <li>
            <strong>
              Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II e Art. 16, I):
            </strong>{' '}
            para retenção de dados fiscais, contratos turísticos e obrigações do Cadastur.
          </li>
          <li>
            <strong>Legítimo Interesse do Controlador (Art. 7º, IX):</strong> para prevenção a
            fraudes, segurança da aplicação contra abusos e aprimoramento dos serviços.
          </li>
        </ul>
      </section>

      {/* 2. Dados Coletados */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          2. Dados Pessoais Coletados
        </h2>
        <div className="space-y-3 text-sm text-stone-700">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
            <h3 className="font-bold text-stone-900">
              A. Dados fornecidos pelo usuário no cadastro:
            </h3>
            <p className="text-stone-600">
              Nome completo, endereço de e-mail, foto de perfil (quando autenticado com Google ou
              carregada), telefone/WhatsApp, número de CPF e data de nascimento (necessários para a
              emissão do voucher e identificação de passageiros junto às operadoras).
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
            <h3 className="font-bold text-stone-900">
              B. Dados de agências parceiras e guias nativos:
            </h3>
            <p className="text-stone-600">
              Razão social, nome fantasia, CNPJ, número de registro ativo no Cadastur, telefone,
              endereço comercial, biomas e especialidades de atuação.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-1.5">
            <h3 className="font-bold text-stone-900">C. Dados de navegação e técnicos:</h3>
            <p className="text-stone-600">
              Endereço IP mascarado, tipo de navegador, registros de data/hora de login (Marco Civil
              da Internet, Art. 15), identificadores de sessão criptografados pelo Firebase Auth e
              preferências de consentimento salvas em <code>localStorage</code>.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Compartilhamento */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          3. Compartilhamento de Dados com Terceiros
        </h2>
        <p className="text-sm text-stone-700">
          O SouNativo <strong>nunca comercializa, aluga ou monetiza</strong> seus dados pessoais
          para terceiros ou corretores de dados. O compartilhamento ocorre apenas nas seguintes
          situações estritamente necessárias:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-600 pl-2">
          <li>
            <strong>Com a agência ou guia responsável pelo pacote reservado:</strong> nome,
            telefone, documento e observações de embarque para que possam prestar o serviço de
            turismo e organizar a lista de passageiros.
          </li>
          <li>
            <strong>Com provedores de infraestrutura e nuvem (Operadores):</strong> Google Cloud
            Platform / Firebase (hospedagem de banco de dados e autenticação criptografada) e Vercel
            Inc. (entrega do front-end via CDN global).
          </li>
          <li>
            <strong>Por determinação legal ou judicial:</strong> quando exigido por autoridade
            competente, tribunal ou órgão fiscalizador nos termos da legislação brasileira.
          </li>
        </ol>
      </section>

      {/* 4. Retenção e Descarte */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          4. Período de Retenção e Descarte dos Dados
        </h2>
        <p className="text-sm text-stone-700">
          Os dados cadastrais permanecem armazenados enquanto durar a conta ativa do usuário. Ao
          solicitar a exclusão definitiva, seus dados cadastrais, favoritos e registros de sessão
          são eliminados do Firebase Auth e do Cloud Firestore.
        </p>
        <p className="text-sm text-stone-600 bg-stone-100 p-3.5 rounded-xl border border-stone-200">
          <strong>Exceção de Retenção Legal (Art. 16, I da LGPD):</strong> Informações financeiras e
          vouchers de viagens concluídas são retidos pelo prazo prescricional de 5 (cinco) anos para
          cumprimento do Código de Defesa do Consumidor (Lei nº 8.078/1990) e exigências
          tributárias.
        </p>
      </section>

      {/* 5. Direitos do Titular */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          5. Seus Direitos como Titular (Art. 18 da LGPD)
        </h2>
        <p className="text-sm text-stone-700">
          A qualquer momento, sem custos e mediante requisição simples no seu painel ou por e-mail,
          você tem direito a:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>I. Confirmação e Acesso:</strong> saber se tratamos seus dados e quais são eles.
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>II. Correção:</strong> retificar dados incompletos, inexatos ou desatualizados.
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>III. Portabilidade:</strong> baixar arquivo completo (.json) de seus dados.
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>IV. Eliminação (Esquecimento):</strong> exclusão definitiva da sua conta e
            dados.
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>V. Revogação do Consentimento:</strong> desligar cookies de analytics ou
            marketing.
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <strong>VI. Informação de Compartilhamento:</strong> saber com quem seus dados foram
            divididos.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to="/dashboard?mode=privacy"
            className="inline-flex items-center justify-center gap-1.5 min-h-[36px] rounded-xl bg-primary-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
          >
            <Download size={14} aria-hidden="true" />
            Acessar Painel do Titular (Exportar ou Excluir)
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={openConsentBanner}
            leftIcon={<Lock size={14} />}
          >
            Ajustar Preferências de Cookies
          </Button>
        </div>
      </section>

      {/* 6. Encarregado DPO */}
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-3">
        <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
          <Mail size={18} className="text-primary-600" />
          6. Canal de Atendimento e Encarregado de Dados (DPO)
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Para esclarecer dúvidas sobre esta Política, exercer seus direitos de titular ou notificar
          qualquer incidente, entre em contato diretamente com nosso Encarregado pelo Tratamento de
          Dados Pessoais:
        </p>
        <div className="text-sm text-stone-800 space-y-1 font-mono">
          <p>
            <strong>Encarregado (DPO):</strong> Equipe de Segurança &amp; Privacidade SouNativo
          </p>
          <p>
            <strong>E-mail direto:</strong> privacidade@sounativo.com / suporte@sounativo.com
          </p>
          <p>
            <strong>Prazo de resposta:</strong> em até 15 (quinze) dias corridos, conforme Art. 19,
            II da LGPD.
          </p>
        </div>
      </section>
    </article>
  );
};
