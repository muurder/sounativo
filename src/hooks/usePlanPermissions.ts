import { useMemo } from 'react';
import { SUBSCRIPTION_PLANS } from '@/utils/constants';
import { PlanTier } from '@/types';

export function usePlanPermissions(plan: PlanTier = 'STARTER', activeTripsCount = 0) {
  return useMemo(() => {
    const planConfig = SUBSCRIPTION_PLANS.find((p) => p.id === plan) ?? SUBSCRIPTION_PLANS[0];
    const maxTrips = planConfig.maxActiveTrips;
    return {
      plan,
      planName: planConfig.name,
      maxTrips,
      canPublishMoreTrips: activeTripsCount < maxTrips,
      canCustomizeTheme: plan === 'BASIC' || plan === 'PREMIUM',
      canAccessOperationalTools: plan === 'PREMIUM',
    };
  }, [activeTripsCount, plan]);
}
