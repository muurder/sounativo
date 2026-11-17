import React from 'react';
import { PlanTier } from '@/types';
import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { formatCurrencyBRL } from '@/utils/formatters';

interface PartnerPlansSectionProps {
  currentPlan: PlanTier;
}

export const PartnerPlansSection: React.FC<PartnerPlansSectionProps> = ({ currentPlan }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {SUBSCRIPTION_PLANS.map((plan) => (
      <div
        key={plan.id}
        className={`rounded-2xl border p-5 bg-white ${
          plan.id === currentPlan
            ? 'border-primary-500 ring-1 ring-primary-500'
            : 'border-stone-200'
        }`}
      >
        <h4 className="font-serif text-lg font-bold text-stone-900">{plan.name}</h4>
        <p className="text-2xl font-extrabold text-primary-600 mt-1">
          {plan.priceMonthly === 0 ? 'Grátis' : `${formatCurrencyBRL(plan.priceMonthly)}/mês`}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-stone-600">
          {plan.features.map((feat) => (
            <li key={feat}>• {feat}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);
