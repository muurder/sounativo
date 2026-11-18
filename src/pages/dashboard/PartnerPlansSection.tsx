import React, { useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { Agency, PlanTier, SubscriptionStatus } from '@/types';
import { requestAgencyPlanUpgradeInFirestore } from '@/services/agencyService';
import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { formatCurrencyBRL } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PartnerPlansSectionProps {
  agency?: Agency;
  agencyId?: string;
  currentPlan?: PlanTier;
  subscriptionStatus?: SubscriptionStatus;
  onPlanUpdated?: (next: {
    subscriptionPlan: PlanTier;
    subscriptionStatus: SubscriptionStatus;
  }) => void;
}

export const PartnerPlansSection: React.FC<PartnerPlansSectionProps> = ({
  agency,
  agencyId,
  currentPlan,
  subscriptionStatus,
  onPlanUpdated,
}) => {
  const { showToast } = useToast();
  const [requestingPlan, setRequestingPlan] = useState<PlanTier | null>(null);

  const resolvedId = agency?.id ?? agencyId ?? '';
  const resolvedPlan: PlanTier = agency?.subscriptionPlan ?? currentPlan ?? 'STARTER';
  const resolvedStatus: SubscriptionStatus =
    agency?.subscriptionStatus ?? subscriptionStatus ?? 'ACTIVE';

  const handleSelectPlan = async (targetPlan: PlanTier) => {
    if (!resolvedId) return;
    if (targetPlan === resolvedPlan && resolvedStatus === 'ACTIVE') return;

    setRequestingPlan(targetPlan);
    try {
      const updated = await requestAgencyPlanUpgradeInFirestore(resolvedId, targetPlan);
      onPlanUpdated?.(updated);
      if (updated.subscriptionStatus === 'PENDING') {
        showToast(
          `Solicitação do plano ${targetPlan} registrada! A ativação será concluída pela equipe comercial.`,
          'info'
        );
      } else {
        showToast('Plano Starter ativado com sucesso.', 'success');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao solicitar alteração de plano.',
        'error'
      );
    } finally {
      setRequestingPlan(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">Planos de Parceria</h3>
          <p className="text-xs text-stone-600">
            Amplie seu limite de pacotes ativos e recursos de microsite whitelabel.
          </p>
        </div>
        {resolvedStatus === 'PENDING' && (
          <Badge tone="warning">
            <Clock size={12} /> Ativação comercial pendente ({resolvedPlan})
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = plan.id === resolvedPlan;
          const isPendingCurrent = isCurrent && resolvedStatus === 'PENDING';
          const isActiveCurrent = isCurrent && resolvedStatus === 'ACTIVE';

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 bg-white flex flex-col justify-between gap-4 ${
                isCurrent ? 'border-primary-500 ring-1 ring-primary-500' : 'border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-lg font-bold text-stone-900">{plan.name}</h4>
                  {isActiveCurrent && (
                    <Badge tone="success">
                      <CheckCircle2 size={11} /> Atual
                    </Badge>
                  )}
                  {isPendingCurrent && (
                    <Badge tone="warning">
                      <Clock size={11} /> Em análise
                    </Badge>
                  )}
                </div>

                <p className="text-2xl font-extrabold text-primary-600 mt-1">
                  {plan.priceMonthly === 0
                    ? 'Grátis'
                    : `${formatCurrencyBRL(plan.priceMonthly)}/mês`}
                </p>
                <p className="text-xs text-stone-500 mt-1">{plan.description}</p>

                <ul className="mt-3 space-y-1.5 text-xs text-stone-600">
                  {plan.features.map((feat) => (
                    <li key={feat}>• {feat}</li>
                  ))}
                </ul>
              </div>

              <Button
                size="sm"
                fullWidth
                variant={isActiveCurrent ? 'outline' : 'primary'}
                disabled={isActiveCurrent || isPendingCurrent || requestingPlan !== null}
                loading={requestingPlan === plan.id}
                onClick={() => void handleSelectPlan(plan.id)}
              >
                {isActiveCurrent
                  ? 'Plano ativo'
                  : isPendingCurrent
                    ? 'Aguardando ativação'
                    : plan.priceMonthly === 0
                      ? 'Voltar ao Starter'
                      : `Solicitar ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
