import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Cookie,
  Download,
  FileText,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useConsent } from '@/hooks/useConsent';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { deleteUserAccountPermanently, exportUserData } from '@/services/privacyService';

export const PrivacySettings: React.FC = () => {
  const { user, logout } = useAuth();
  const { consent, openConsentBanner } = useConsent();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      await exportUserData(user.uid, user.email);
      showToast('Download do arquivo de dados pessoais iniciado com sucesso!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao compilar arquivo de exportação.',
        'error'
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'EXCLUIR') return;
    setDeleting(true);
    try {
      await deleteUserAccountPermanently(user.uid);
      await logout();
      showToast('Sua conta e dados pessoais foram excluídos definitivamente.', 'info');
      setDeleteModalOpen(false);
      navigate('/', { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao processar exclusão permanente.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header LGPD */}
      <div className="rounded-3xl border border-primary-200 bg-primary-50/50 p-6 sm:p-7 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700">
          <ShieldCheck size={18} />
          Painel de Direitos do Titular (LGPD / GDPR)
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Privacidade e Controle Total dos seus Dados
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed max-w-3xl">
          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), você tem
          o direito de acessar, portar, retificar e solicitar a exclusão de suas informações a
          qualquer momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloco 1: Exportar Dados (Portabilidade) */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Download size={20} />
            </span>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Exportar Meus Dados (Portabilidade)
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Baixe uma cópia completa de todos os seus dados pessoais, perfil, histórico de
              reservas e registros de consentimento em formato legível por máquina (JSON).
            </p>
            <div className="text-xs text-stone-500 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Garantido pelo Art. 18, V da LGPD e Art. 20 do GDPR.
            </div>
          </div>

          <Button
            variant="outline"
            loading={exporting}
            onClick={() => void handleExport()}
            leftIcon={<FileText size={16} />}
          >
            {exporting ? 'Gerando arquivo...' : 'Baixar Meus Dados (.json)'}
          </Button>
        </section>

        {/* Bloco 2: Gestão de Cookies e Consentimento */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
              <Cookie size={20} />
            </span>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Preferências de Rastreio e Cookies
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Gerencie suas escolhas sobre cookies não-essenciais. Você pode autorizar ou revogar o
              uso de ferramentas de análise e personalização a qualquer momento.
            </p>
            <dl className="grid grid-cols-3 gap-2 border-t border-stone-100 pt-2 text-center text-xs">
              <div className="rounded-lg bg-stone-50 p-2">
                <dt className="text-stone-500 text-[10px]">Essenciais</dt>
                <dd className="font-bold text-emerald-700">Ativos</dd>
              </div>
              <div className="rounded-lg bg-stone-50 p-2">
                <dt className="text-stone-500 text-[10px]">Analytics</dt>
                <dd className="font-bold text-stone-800">
                  {consent.analytics ? 'Autorizado' : 'Recusado'}
                </dd>
              </div>
              <div className="rounded-lg bg-stone-50 p-2">
                <dt className="text-stone-500 text-[10px]">Marketing</dt>
                <dd className="font-bold text-stone-800">
                  {consent.marketing ? 'Autorizado' : 'Recusado'}
                </dd>
              </div>
            </dl>
          </div>

          <Button variant="outline" onClick={openConsentBanner} leftIcon={<Lock size={16} />}>
            Gerenciar Preferências
          </Button>
        </section>
      </div>

      {/* Bloco 3: Zona de Perigo - Eliminação Definitiva */}
      <section className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <ShieldAlert size={22} />
          </span>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-red-950">
              Zona de Exclusão Definitiva (Direito ao Esquecimento)
            </h3>
            <p className="text-sm text-red-900/80 leading-relaxed">
              A exclusão apaga permanentemente seu cadastro no Firebase Auth, favoritos e dados de
              perfil. Esta ação é irreversível e não poderá ser desfeita.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-red-200/80 bg-white p-4 text-xs text-stone-600 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-stone-800">Aviso legal sobre retenção regulatória:</p>
          <p>
            Conforme previsto no Art. 16, I da LGPD, dados fiscais e de confirmação de reservas já
            executadas permanecem armazenados de forma restrita para cumprimento de obrigações
            legais (tributárias e código de defesa do consumidor).
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 size={16} />}
          >
            Excluir Minha Conta Permanentemente
          </Button>
        </div>
      </section>

      {/* Modal de Confirmação Crítica */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setConfirmText('');
          }
        }}
        title="Confirmar Exclusão Definitiva"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-900 text-xs leading-relaxed">
            <AlertTriangle size={20} className="shrink-0 text-red-600" />
            <span>
              Atenção: Todos os seus dados de perfil, favoritos e sessão serão excluídos de
              imediato.
            </span>
          </div>

          <p className="text-sm text-stone-700">
            Para confirmar que deseja apagar sua conta permanentemente, digite{' '}
            <strong className="font-mono text-red-700">EXCLUIR</strong> no campo abaixo:
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Digite EXCLUIR"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 px-3.5 text-sm font-mono tracking-widest focus:border-red-500 focus:outline-none"
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => {
                setDeleteModalOpen(false);
                setConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmText !== 'EXCLUIR' || deleting}
              loading={deleting}
              onClick={() => void handleDeleteAccount()}
            >
              Excluir Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
