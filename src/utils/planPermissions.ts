import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { PlanTier, SubscriptionStatus } from '@/types';

export function getPlanPermissions(
  plan: PlanTier = 'STARTER',
  activeTripsCount = 0,
  subscriptionStatus: SubscriptionStatus = 'ACTIVE'
) {
  const effectivePlan: PlanTier =
    plan !== 'STARTER' && subscriptionStatus !== 'ACTIVE' ? 'STARTER' : plan;
  const planConfig =
    SUBSCRIPTION_PLANS.find((p) => p.id === effectivePlan) ?? SUBSCRIPTION_PLANS[0];
  const maxTrips = planConfig.maxActiveTrips;
  return {
    plan: effectivePlan,
    planName: planConfig.name,
    maxTrips,
    canPublishMoreTrips: activeTripsCount < maxTrips,
    canCustomizeTheme: effectivePlan === 'BASIC' || effectivePlan === 'PREMIUM',
    canAccessOperationalTools: effectivePlan === 'PREMIUM',
  };
}
