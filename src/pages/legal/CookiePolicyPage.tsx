import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, RefreshCw, ShieldCheck } from 'lucide-react';
import { useConsent } from '@/hooks/useConsent';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/Button';

export const CookiePolicyPage: React.FC = () => {
  const { consent, openConsentBanner } = useConsent();

  usePageMeta({
    title: 'Política de Cookies',
    description:
      'Saiba como utilizamos cookies essenciais, analíticos e de marketing e gerencie suas preferências no SouNativo.',
    canonicalPath: '/cookies',
  });

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-stone-800 leading-relaxed space-y-8">
      {/* Header */}
      <header className="border-b border-stone-200 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800 uppercase tracking-wider">
          <Cookie size={14} />
          Diretrizes de Rastreio e Transparência
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
          Política de Cookies e Tecnologias de Rastreio
        </h1>
        <p className="text-sm text-stone-500">
          Última atualização: 17 de novembro de 2026 · Versão: 2026-v1.0
        </p>
      </header>

      {/* Introdução */}
      <section className="space-y-4">
        <p className="text-base text-stone-700">
          Esta Política de Cookies explica de forma transparente o que são cookies, quais tipos
          utilizamos na plataforma <strong>SouNativo</strong>, para quais finalidades e como você
          pode exercer controle total sobre o armazenamento dessas informações no seu dispositivo.
        </p>
      </section>

      {/* 1. O que são cookies */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          1. O que são Cookies?
        </h2>
        <p className="text-sm text-stone-700">
          Cookies são pequenos arquivos de texto enviados pelo servidor da aplicação e salvos no
          navegador do seu computador ou celular. Eles permitem reconhecer sua sessão de login,
          lembrar preferências de idioma e tema, além de verificar se você já respondeu aos nossos
          termos de privacidade.
        </p>
      </section>

      {/* 2. Tabela de Cookies */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          2. Categorias e Tabela de Cookies Utilizados
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="p-3.5">Nome / Chave</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Finalidade</th>
                <th className="p-3.5">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-600">
              <tr>
                <td className="p-3.5 font-mono text-primary-800">sounativo_privacy_consent_v1</td>
                <td className="p-3.5 font-semibold text-emerald-800">Essencial</td>
                <td className="p-3.5">
                  Salva suas escolhas de consentimento LGPD no <code>localStorage</code>.
                </td>
                <td className="p-3.5">1 ano</td>
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-primary-800">firebase:authUser:*</td>
                <td className="p-3.5 font-semibold text-emerald-800">Essencial</td>
                <td className="p-3.5">
                  Identificador de sessão autenticada pelo Firebase Auth (Google ou e-mail).
                </td>
                <td className="p-3.5">Sessão</td>
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-primary-800">_ga, _gid, _gat</td>
                <td className="p-3.5 font-semibold text-stone-800">Analytics</td>
                <td className="p-3.5">
                  Métricas anônimas de tráfego, taxa de conversão de pacotes e tempos de
                  carregamento.
                </td>
                <td className="p-3.5">24h a 2 anos</td>
              </tr>
              <tr>
                <td className="p-3.5 font-mono text-primary-800">_fbp, _gcl_au</td>
                <td className="p-3.5 font-semibold text-stone-800">Marketing</td>
                <td className="p-3.5">
                  Mapeamento de campanhas de divulgação de ecoturismo em redes sociais.
                </td>
                <td className="p-3.5">Até 90 dias</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Status Atual */}
      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6 space-y-4">
        <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary-600" />
          3. Seu Status de Consentimento Neste Navegador
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="text-xs text-stone-500 block">Cookies Essenciais</span>
            <strong className="text-emerald-700 font-bold">Sempre Ativos</strong>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="text-xs text-stone-500 block">Estatísticas (Analytics)</span>
            <strong className="text-stone-800 font-bold">
              {consent.analytics ? 'Autorizado' : 'Bloqueado'}
            </strong>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="text-xs text-stone-500 block">Marketing &amp; Personalização</span>
            <strong className="text-stone-800 font-bold">
              {consent.marketing ? 'Autorizado' : 'Bloqueado'}
            </strong>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={openConsentBanner}
          leftIcon={<RefreshCw size={14} />}
        >
          Modificar Preferências de Cookies
        </Button>
      </section>

      {/* 4. Gerenciamento no Navegador */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold text-stone-900 border-l-4 border-primary-600 pl-3">
          4. Como Bloquear ou Limpar Cookies no seu Navegador
        </h2>
        <p className="text-sm text-stone-700">
          Além dos nossos controles internos, você pode configurar diretamente seu navegador para
          recusar ou apagar cookies a qualquer momento:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-stone-600 pl-2">
          <li>
            <strong>Google Chrome:</strong> Configurações &gt; Privacidade e Segurança &gt; Cookies
            e outros dados de sites.
          </li>
          <li>
            <strong>Mozilla Firefox:</strong> Opções &gt; Privacidade e Segurança &gt; Cookies e
            dados de sites.
          </li>
          <li>
            <strong>Apple Safari:</strong> Preferências &gt; Privacidade &gt; Gerenciar dados de
            sites.
          </li>
          <li>
            <strong>Microsoft Edge:</strong> Configurações &gt; Permissões de site &gt; Cookies e
            dados armazenados.
          </li>
        </ul>
      </section>

      {/* Footer navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200 text-sm">
        <Link to="/privacy" className="font-semibold text-primary-700 hover:text-primary-800">
          &larr; Política de Privacidade
        </Link>
        <Link to="/terms" className="font-semibold text-primary-700 hover:text-primary-800">
          Termos de Uso &rarr;
        </Link>
      </div>
    </article>
  );
};
