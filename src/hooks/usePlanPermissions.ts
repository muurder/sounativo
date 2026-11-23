import { useMemo } from 'react';
import { PlanTier, SubscriptionStatus } from '@/types';
import { getPlanPermissions } from '@/utils/planPermissions';

export function usePlanPermissions(
  plan: PlanTier = 'STARTER',
  activeTripsCount = 0,
  subscriptionStatus: SubscriptionStatus = 'ACTIVE'
) {
  return useMemo(
    () => getPlanPermissions(plan, activeTripsCount, subscriptionStatus),
    [activeTripsCount, plan, subscriptionStatus]
  );
}
